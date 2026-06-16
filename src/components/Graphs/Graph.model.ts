import { Condition, ManagedResourceGroup, ManagedResourceItem, ProviderConfigs } from '../../lib/shared/types';
import { Edge, Node, Position } from '@xyflow/react';
import ELK, { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ColorBy, NodeData } from './types';

// Public types

export type EdgePoint = { x: number; y: number };

export type EdgeSpec = {
  id: string;
  source: string;
  target: string;
  aux: boolean;
};

export type RefSource =
  | { type: 'forProvider'; key: string }
  | { type: 'spec'; key: string }
  | { type: 'path'; path: string }
  | { type: 'predicate'; match: (item: ManagedResourceItem) => string | undefined };

export type RefRule = {
  // Filters — all that are present must match.
  refKey?: string;
  refKeyPattern?: RegExp;
  fromKind?: string;
  fromKindPattern?: RegExp;

  // Discovery override (omit to use default discovery).
  source?: RefSource;

  // Resolution.
  targetKind?: string;
  targetKindFn?: (refKey: string) => string;
  role?: 'parent' | 'extra';
  priority?: number;
};

export interface GraphInput {
  managedResources: ManagedResourceGroup[] | undefined;
  providerConfigs: ProviderConfigs[] | undefined;
  onYamlClick: (item: ManagedResourceItem) => void;
  rules?: RefRule[];
  parentKeys?: string[];
}

export type LayoutResult = { nodes: Node<NodeData>[]; edges: Edge[] };

export type LayoutDirection = 'TB' | 'LR';

export type LayoutOptions = {
  showAux: boolean;
  colorBy: ColorBy;
  labelKey?: string;
  colorMap: Record<string, string>;
  direction?: LayoutDirection;
};

// Module-level constants

export const DEFAULT_PARENT_KEYS: readonly string[] = [
  'serviceManagerRef',
  'subaccountRef',
  'kymaEnvironmentBindingRef',
];

export const DEFAULT_RULES: readonly RefRule[] = [
  // KymaModule binding falls back to KymaEnvironment of the same name (the
  // KymaEnvironmentBinding it references isn't a managed resource).
  { refKey: 'kymaEnvironmentBindingRef', fromKind: 'KymaModule', targetKind: 'KymaEnvironment' },
  // Object inherits its KymaEnvironment via providerConfigRef.name.
  {
    refKey: 'providerConfigRef',
    fromKind: 'Object',
    targetKind: 'KymaEnvironment',
    source: { type: 'spec', key: 'providerConfigRef' },
    role: 'parent',
    priority: 100,
  },
  // Catch-all: convention-derived kind, role from parentKeys list.
  {},
];

const COLORS: readonly string[] = [
  '#FFC933',
  '#FF8AF0',
  '#FEADC8',
  '#2CE0BF',
  '#FF8CB2',
  '#B894FF',
  '#049F9A',
  '#FA4F96',
  '#F31DED',
  '#7858FF',
  '#07838F',
  '#DF1278',
  '#510080',
  '#5D36FF',
];

const SYSTEM_LABEL_PREFIXES: readonly string[] = [
  'app.kubernetes.io/',
  'kubernetes.io/',
  'helm.sh/',
  'crossplane.io/',
  'pod-template-hash',
];

const NODE_WIDTH = 250;
const NODE_HEIGHT = 60;

const ELK_LAYOUT_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.spacing.nodeNodeBetweenLayers': '160',
  'elk.layered.spacing.edgeNodeBetweenLayers': '50',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
  'elk.spacing.nodeNode': '120',
  'elk.spacing.componentComponent': '160',
  'elk.spacing.edgeNode': '30',
  'elk.spacing.edgeEdge': '20',
  'elk.spacing.portPort': '20',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.mergeEdges': 'true',
  'elk.layered.mergeHierarchyEdges': 'true',
};

// Maps the user-visible direction to ELK's direction keyword and the matching
// ReactFlow handle positions, so a single switch stays consistent.
const DIRECTION_CONFIG: Record<LayoutDirection, { elk: string; source: Position; target: Position }> = {
  TB: { elk: 'DOWN', source: Position.Bottom, target: Position.Top },
  LR: { elk: 'RIGHT', source: Position.Right, target: Position.Left },
};

// One ELK instance shared across all Graph layouts; cheap to reuse.
const elkSingleton = new ELK();

// Pure helpers (exported for testing)

export function inferKindFromRefKey(refKey: string): string {
  const stripped = refKey.replace(/Ref$/, '');
  if (!stripped) return '';
  return stripped[0].toUpperCase() + stripped.slice(1);
}

export type DiscoveredRef = { refKey: string; name: string; sourceLabel: 'forProvider' | 'spec' };

export function discoverRefs(item: ManagedResourceItem): DiscoveredRef[] {
  const out: DiscoveredRef[] = [];
  const spec = item?.spec as Record<string, unknown> | undefined;
  if (!spec || typeof spec !== 'object') return out;

  const seen = new Set<string>();
  const isRefShape = (v: unknown): v is { name: string } =>
    !!v && typeof v === 'object' && typeof (v as { name?: unknown }).name === 'string';

  const forProvider = spec.forProvider as Record<string, unknown> | undefined;
  if (forProvider && typeof forProvider === 'object') {
    Object.keys(forProvider).forEach((k) => {
      if (!/Ref$/.test(k)) return;
      const v = forProvider[k];
      if (!isRefShape(v)) return;
      out.push({ refKey: k, name: v.name, sourceLabel: 'forProvider' });
      seen.add(k);
    });
  }

  Object.keys(spec).forEach((k) => {
    if (k === 'forProvider') return;
    // providerConfigRef is universally present on Crossplane managed resources
    // and never refers to another graph node by convention. Exclude from default
    // discovery; rules that need it (e.g. the Object→KymaEnvironment override)
    // declare an explicit `source`.
    if (k === 'providerConfigRef') return;
    if (!/Ref$/.test(k)) return;
    if (seen.has(k)) return; // forProvider wins
    const v = spec[k];
    if (!isRefShape(v)) return;
    out.push({ refKey: k, name: v.name, sourceLabel: 'spec' });
  });

  return out;
}

export function versionRank(apiVersion: string): number {
  const v = apiVersion.split('/')[1] ?? '';
  if (/^v\d+$/.test(v)) return 1000 + parseInt(v.slice(1), 10);
  const m = v.match(/^v(\d+)beta(\d+)$/);
  if (m) return 500 + parseInt(m[1], 10) * 10 + parseInt(m[2], 10);
  const a = v.match(/^v(\d+)alpha(\d+)$/);
  if (a) return 100 + parseInt(a[1], 10) * 10 + parseInt(a[2], 10);
  return 0;
}

export function getStatusCondition(conditions?: Condition[]): Condition | undefined {
  if (!conditions || !Array.isArray(conditions)) return undefined;
  return conditions.find((c) => c.type === 'Ready' || c.type === 'Healthy');
}

export function resolveProviderTypeFromApiVersion(apiVersion: string): string {
  const domain = apiVersion?.split('/')[0] || '';
  const normalizedDomain = domain.replace(/^account\./, '');
  return normalizedDomain || 'unknown';
}

export function isSystemLabel(key: string): boolean {
  return SYSTEM_LABEL_PREFIXES.some((p) => (p.endsWith('/') ? key.startsWith(p) : key === p));
}

// Read a candidate ref name from an item using the rule's source override.
export function readBySource(item: ManagedResourceItem, source: RefSource): string | undefined {
  if (source.type === 'predicate') return source.match(item);
  if (source.type === 'path') {
    const parts = source.path.split('.');
    let cur: unknown = item;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = (cur as Record<string, unknown>)[p];
    }
    if (cur && typeof cur === 'object' && typeof (cur as { name?: unknown }).name === 'string') {
      return (cur as { name: string }).name;
    }
    if (typeof cur === 'string') return cur;
    return undefined;
  }
  const spec = item?.spec as Record<string, unknown> | undefined;
  if (!spec) return undefined;
  if (source.type === 'forProvider') {
    const fp = spec.forProvider as Record<string, unknown> | undefined;
    return (fp?.[source.key] as { name?: string } | undefined)?.name;
  }
  return (spec[source.key] as { name?: string } | undefined)?.name;
}

export function ruleMatches(rule: RefRule, refKey: string, fromKind: string): boolean {
  if (rule.refKey !== undefined && rule.refKey !== refKey) return false;
  if (rule.refKeyPattern && !rule.refKeyPattern.test(refKey)) return false;
  if (rule.fromKind !== undefined && rule.fromKind !== fromKind) return false;
  if (rule.fromKindPattern && !rule.fromKindPattern.test(fromKind)) return false;
  return true;
}

type ItemRecord = {
  item: ManagedResourceItem;
  name: string;
  kind: string;
  apiVersion: string;
  id: string;
};

// The Graph class — encapsulates all data-layer logic for the resource graph.
export class Graph {
  readonly nodes: NodeData[];
  readonly nodeById: Map<string, NodeData>;
  private readonly rules: readonly RefRule[];
  private readonly parentKeys: readonly string[];

  constructor(input: GraphInput) {
    this.rules = input.rules ?? DEFAULT_RULES;
    this.parentKeys = input.parentKeys ?? DEFAULT_PARENT_KEYS;

    if (!input.managedResources || !input.providerConfigs) {
      this.nodes = [];
      this.nodeById = new Map();
      return;
    }

    const records = Graph.collectRecords(input.managedResources);
    const idByNameAndKind = Graph.buildIndex(records);
    this.nodes = this.buildNodes(records, idByNameAndKind, input.onYamlClick);
    this.nodeById = new Map(this.nodes.map((n) => [n.id, n]));
  }

  // Public methods

  collectEdges(includeAux = true): EdgeSpec[] {
    const out: EdgeSpec[] = [];
    const emitted = new Set<string>();
    const push = (spec: EdgeSpec) => {
      if (emitted.has(spec.id)) return;
      emitted.add(spec.id);
      out.push(spec);
    };
    this.nodes.forEach((n) => {
      if (n.parentId && this.nodeById.has(n.parentId)) {
        push({ id: `e-${n.parentId}-${n.id}`, source: n.parentId, target: n.id, aux: false });
      }
      if (!includeAux) return;
      n.extraRefs?.forEach((refId) => {
        if (this.nodeById.has(refId)) {
          push({ id: `e-${refId}-${n.id}`, source: refId, target: n.id, aux: true });
        }
      });
    });
    return out;
  }

  colorKeyOf(n: NodeData, colorBy: ColorBy, labelKey?: string): string {
    switch (colorBy) {
      case 'source':
        return n.providerType;
      case 'flux':
        return n.fluxName ?? 'default';
      case 'label':
        return (labelKey && n.labels?.[labelKey]) || 'default';
      default:
        return n.providerConfigName;
    }
  }

  generateColorMap(colorBy: ColorBy, labelKey?: string): Record<string, string> {
    const keys = (() => {
      if (colorBy === 'source') {
        return Array.from(new Set(this.nodes.map((i) => i.providerType).filter(Boolean)));
      }
      if (colorBy === 'flux') {
        return Array.from(new Set(this.nodes.map((i) => i.fluxName ?? 'default')));
      }
      if (colorBy === 'label') {
        return Array.from(new Set(this.nodes.map((i) => (labelKey && i.labels?.[labelKey]) || 'default')));
      }
      return Array.from(new Set(this.nodes.map((i) => i.providerConfigName).filter(Boolean)));
    })();

    const map = new Map<string, string>();
    keys.forEach((key, i) => map.set(key, COLORS[i % COLORS.length]));
    if ((colorBy === 'flux' || colorBy === 'label') && keys.includes('default')) {
      map.set('default', '#BFBFBF');
    }
    return Object.fromEntries(map);
  }

  listCommonLabelKeys(): string[] {
    const counts = new Map<string, number>();
    this.nodes.forEach((n) => {
      Object.keys(n.labels ?? {}).forEach((k) => {
        if (isSystemLabel(k)) return;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
  }

  async layout(opts: LayoutOptions): Promise<LayoutResult> {
    if (!this.nodes.length) return { nodes: [], edges: [] };

    const dir = DIRECTION_CONFIG[opts.direction ?? 'TB'];

    const edgeSpecs = this.collectEdges(opts.showAux);
    const primarySpecs = edgeSpecs.filter((e) => !e.aux);
    const auxSpecs = edgeSpecs.filter((e) => e.aux);

    const elkGraph: ElkNode = {
      id: 'root',
      layoutOptions: { ...ELK_LAYOUT_OPTIONS, 'elk.direction': dir.elk },
      children: this.nodes.map<ElkNode>((n) => ({ id: n.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
      edges: [
        ...primarySpecs.map<ElkExtendedEdge>((e) => ({
          id: e.id,
          sources: [e.source],
          targets: [e.target],
          layoutOptions: { 'elk.priority': '10' },
        })),
        ...auxSpecs.map<ElkExtendedEdge>((e) => ({
          id: e.id,
          sources: [e.source],
          targets: [e.target],
          layoutOptions: { 'elk.priority': '0' },
        })),
      ],
    };

    const laid = await elkSingleton.layout(elkGraph);
    const positionById = new Map<string, { x: number; y: number }>();
    laid.children?.forEach((c) => positionById.set(c.id, { x: c.x ?? 0, y: c.y ?? 0 }));

    const nodes: Node<NodeData>[] = this.nodes.map((n) => {
      const pos = positionById.get(n.id) ?? { x: 0, y: 0 };
      const borderColor = opts.colorMap[this.colorKeyOf(n, opts.colorBy, opts.labelKey)] || '#ccc';
      return {
        id: n.id,
        type: 'custom',
        data: { ...n },
        style: {
          border: `2px solid ${borderColor}`,
          borderRadius: 8,
          backgroundColor: `${borderColor}08`,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        position: pos,
        sourcePosition: dir.source,
        targetPosition: dir.target,
      };
    });

    const primaryIds = new Set(primarySpecs.map((s) => s.id));
    const primaryEdges: Edge[] = (laid.edges ?? [])
      .filter((le) => primaryIds.has(le.id))
      .map((le) => {
        const section = le.sections?.[0];
        const points: EdgePoint[] = section
          ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
          : [];
        const spec = primarySpecs.find((s) => s.id === le.id);
        return {
          id: le.id,
          source: spec?.source ?? '',
          target: spec?.target ?? '',
          type: 'orth',
          data: { points, aux: false },
          style: { strokeWidth: 2, stroke: '#888' },
        };
      });

    const auxEdges: Edge[] = auxSpecs.map((spec) => ({
      id: spec.id,
      source: spec.source,
      target: spec.target,
      type: 'smoothstep',
      data: { aux: true },
      style: { strokeWidth: 1.5, stroke: '#888', strokeDasharray: '6 4', opacity: 0.6 },
    }));

    return { nodes, edges: [...primaryEdges, ...auxEdges] };
  }

  // Internal pipeline

  private static collectRecords(managedResources: ManagedResourceGroup[]): ItemRecord[] {
    const out: ItemRecord[] = [];
    managedResources.forEach((group) => {
      group.items?.forEach((item) => {
        const name = item?.metadata?.name;
        const apiVersion = item?.apiVersion ?? '';
        const kind = item?.kind ?? '';
        if (!name || !apiVersion) return;
        out.push({ item, name, kind, apiVersion, id: `${name}-${apiVersion}` });
      });
    });
    return out;
  }

  // The Kubernetes API serves the same stored object under multiple registered
  // versions. Keep the highest-rank version per (name, kind) so ref resolution
  // doesn't land on a phantom alpha that shares an id with a different kind at
  // the same version.
  private static buildIndex(records: ItemRecord[]): Map<string, string> {
    const idByNameAndKind = new Map<string, string>();
    const apiVersionByKey = new Map<string, string>();
    records.forEach((r) => {
      const k = `${r.name}::${r.kind}`;
      const prev = apiVersionByKey.get(k);
      if (prev && versionRank(prev) >= versionRank(r.apiVersion)) return;
      apiVersionByKey.set(k, r.apiVersion);
      idByNameAndKind.set(k, r.id);
    });
    return idByNameAndKind;
  }

  private buildNodes(
    records: ItemRecord[],
    idByNameAndKind: Map<string, string>,
    onYamlClick: (item: ManagedResourceItem) => void,
  ): NodeData[] {
    const allNodesMap = new Map<string, NodeData>();

    const resolveRef = (refName: string | undefined, targetKind: string | undefined): string | undefined => {
      if (!refName || !targetKind) return undefined;
      return idByNameAndKind.get(`${refName}::${targetKind}`);
    };

    records.forEach(({ item, kind, apiVersion, id }) => {
      const providerConfigName = item?.spec?.providerConfigRef?.name ?? 'unknown';
      const providerType = resolveProviderTypeFromApiVersion(apiVersion);
      const statusCond = getStatusCondition(item?.status?.conditions);
      const status = statusCond?.status === 'True' ? 'OK' : 'ERROR';
      const conditions = (item?.status?.conditions ?? []).map((condition) => ({
        ...condition,
        type: String(condition.type),
        reason: condition.reason ?? '',
        message: condition.message ?? '',
      }));

      let fluxName: string | undefined;
      const labelsMap = (item.metadata as unknown as { labels?: Record<string, string> }).labels;
      if (labelsMap) {
        const key = Object.keys(labelsMap).find((k) => k.endsWith('/name'));
        if (key) fluxName = labelsMap[key];
      }

      const { parentId, extraRefs } = this.resolveItemRefs(item, kind, resolveRef);

      allNodesMap.set(id, {
        id,
        label: id,
        type: kind,
        providerConfigName,
        providerType,
        status,
        transitionTime: statusCond?.lastTransitionTime ?? '',
        statusMessage: statusCond?.reason ?? statusCond?.message ?? '',
        conditions,
        fluxName,
        labels: labelsMap,
        parentId,
        extraRefs,
        item,
        onYamlClick,
      });
    });

    return Array.from(allNodesMap.values());
  }

  // Rule engine: per item, discover refs + path/predicate-injected refs, run
  // each through the rule list, bucket into parent (priority-ranked) + extras.
  private resolveItemRefs(
    item: ManagedResourceItem,
    kind: string,
    resolveRef: (refName: string | undefined, targetKind: string | undefined) => string | undefined,
  ): { parentId: string | undefined; extraRefs: string[] } {
    const refsToProcess: { refKey: string; name: string }[] = [];

    discoverRefs(item).forEach((d) => refsToProcess.push({ refKey: d.refKey, name: d.name }));

    // Rules with an explicit `source` inject refs default discovery may not see
    // (paths, predicates, or keys excluded from discovery like providerConfigRef).
    this.rules.forEach((rule) => {
      if (!rule.source) return;
      if (rule.fromKind && rule.fromKind !== kind) return;
      if (rule.fromKindPattern && !rule.fromKindPattern.test(kind)) return;
      const name = readBySource(item, rule.source);
      if (name === undefined) return;
      const refKey = rule.refKey ?? `__${rule.source.type}__`;
      // Skip if discovery (or an earlier rule) already produced this exact pair.
      if (refsToProcess.some((r) => r.refKey === refKey && r.name === name)) return;
      refsToProcess.push({ refKey, name });
    });

    type Candidate = { role: 'parent' | 'extra'; id: string; priority: number };
    const candidates: Candidate[] = [];
    const seen = new Set<string>();

    refsToProcess.forEach(({ refKey, name }) => {
      const matchedRule = this.rules.find((r) => ruleMatches(r, refKey, kind));

      // Source override may re-read the name from a different location.
      let resolvedName = name;
      if (matchedRule?.source) {
        const overridden = readBySource(item, matchedRule.source);
        if (overridden !== undefined) resolvedName = overridden;
      }

      const targetKind = matchedRule?.targetKind ?? matchedRule?.targetKindFn?.(refKey) ?? inferKindFromRefKey(refKey);
      const role = matchedRule?.role ?? (this.parentKeys.includes(refKey) ? 'parent' : 'extra');

      const idx = this.parentKeys.indexOf(refKey);
      const defaultPriority = idx >= 0 ? this.parentKeys.length - idx : 0;
      const priority = matchedRule?.priority ?? defaultPriority;

      const resolvedId = resolveRef(resolvedName, targetKind);
      if (!resolvedId) return;

      const dedupeKey = `${refKey}::${resolvedId}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      candidates.push({ role, id: resolvedId, priority });
    });

    const parents = candidates.filter((c) => c.role === 'parent').sort((a, b) => b.priority - a.priority);
    const parentId = parents[0]?.id;
    const extraRefs = Array.from(
      new Set(candidates.filter((c) => c.role === 'extra' && c.id !== parentId).map((c) => c.id)),
    );

    return { parentId, extraRefs };
  }
}
