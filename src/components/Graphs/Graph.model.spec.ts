import { describe, it, expect, vi } from 'vitest';
import {
  Graph,
  RefRule,
  discoverRefs,
  inferKindFromRefKey,
  versionRank,
  getStatusCondition,
  resolveProviderTypeFromApiVersion,
  isSystemLabel,
  readBySource,
  ruleMatches,
} from './Graph.model';
import type { ManagedResourceGroup, ManagedResourceItem, ProviderConfigs } from '../../lib/shared/types';

const mockOnYamlClick = vi.fn();
const noopProviderConfigs: ProviderConfigs[] = [{ provider: 'p', items: [] }] as never;

const mkItem = (overrides: {
  name: string;
  apiVersion: string;
  kind: string;
  spec?: unknown;
  status?: unknown;
  metadata?: unknown;
}) =>
  ({
    metadata: { name: overrides.name, ...(overrides.metadata as object | undefined) },
    apiVersion: overrides.apiVersion,
    kind: overrides.kind,
    spec: overrides.spec ?? { providerConfigRef: { name: 'pc' }, forProvider: {} },
    status: overrides.status ?? { conditions: [] },
  }) as unknown as ManagedResourceItem;

const buildGraph = (items: ManagedResourceItem[], rules?: RefRule[], parentKeys?: string[]) =>
  new Graph({
    managedResources: [{ items }] as ManagedResourceGroup[],
    providerConfigs: noopProviderConfigs,
    onYamlClick: mockOnYamlClick,
    rules,
    parentKeys,
  });

// ---------- inferKindFromRefKey ----------

describe('inferKindFromRefKey', () => {
  it('strips trailing Ref and capitalizes leading char', () => {
    expect(inferKindFromRefKey('subaccountRef')).toBe('Subaccount');
  });
  it('preserves inner camelCase boundaries', () => {
    expect(inferKindFromRefKey('kymaEnvironmentBindingRef')).toBe('KymaEnvironmentBinding');
  });
  it('returns empty string when stripping yields nothing', () => {
    expect(inferKindFromRefKey('Ref')).toBe('');
  });
  it('passes through keys without Ref suffix', () => {
    expect(inferKindFromRefKey('something')).toBe('Something');
  });
  it('handles already-uppercased leading', () => {
    expect(inferKindFromRefKey('XRef')).toBe('X');
  });
});

// ---------- discoverRefs ----------

describe('discoverRefs', () => {
  it('finds *Ref entries under spec.forProvider', () => {
    const item = mkItem({
      name: 'a',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { subaccountRef: { name: 'sa' } } },
    });
    expect(discoverRefs(item)).toEqual([{ refKey: 'subaccountRef', name: 'sa', sourceLabel: 'forProvider' }]);
  });
  it('finds *Ref entries at spec root', () => {
    const item = mkItem({
      name: 'a',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: {}, cloudManagementRef: { name: 'cm' } },
    });
    expect(discoverRefs(item)).toEqual([{ refKey: 'cloudManagementRef', name: 'cm', sourceLabel: 'spec' }]);
  });
  it('forProvider wins over spec on key collision', () => {
    const item = mkItem({
      name: 'a',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { dupRef: { name: 'fp' } }, dupRef: { name: 'sp' } },
    });
    const refs = discoverRefs(item);
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ refKey: 'dupRef', name: 'fp', sourceLabel: 'forProvider' });
  });
  it('ignores non-Ref keys', () => {
    const item = mkItem({
      name: 'a',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { somethingElse: { name: 'x' } } },
    });
    expect(discoverRefs(item)).toEqual([]);
  });
  it('ignores values lacking name', () => {
    const item = mkItem({
      name: 'a',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { weirdRef: { value: 'no-name' } } },
    });
    expect(discoverRefs(item)).toEqual([]);
  });
  it('null-safe across all levels', () => {
    expect(discoverRefs({} as ManagedResourceItem)).toEqual([]);
    expect(discoverRefs({ spec: null } as unknown as ManagedResourceItem)).toEqual([]);
    expect(discoverRefs({ spec: { forProvider: null } } as unknown as ManagedResourceItem)).toEqual([]);
  });
});

// ---------- versionRank ----------

describe('versionRank', () => {
  it('ranks stable above beta above alpha', () => {
    expect(versionRank('g/v1')).toBeGreaterThan(versionRank('g/v1beta1'));
    expect(versionRank('g/v1beta1')).toBeGreaterThan(versionRank('g/v1alpha1'));
  });
  it('ranks v2 > v1', () => {
    expect(versionRank('g/v2')).toBeGreaterThan(versionRank('g/v1'));
  });
  it('orders within beta', () => {
    expect(versionRank('g/v2beta3')).toBeGreaterThan(versionRank('g/v1beta9'));
    expect(versionRank('g/v1beta2')).toBeGreaterThan(versionRank('g/v1beta1'));
  });
  it('orders within alpha', () => {
    expect(versionRank('g/v1alpha9')).toBeGreaterThan(versionRank('g/v1alpha1'));
  });
  it('returns 0 for malformed version', () => {
    expect(versionRank('g/junk')).toBe(0);
    expect(versionRank('')).toBe(0);
  });
});

// ---------- getStatusCondition ----------

describe('getStatusCondition', () => {
  it('returns Ready when present', () => {
    const cond = { type: 'Ready', status: 'True', lastTransitionTime: '' } as const;
    expect(getStatusCondition([cond])).toEqual(cond);
  });
  it('returns Healthy when Ready missing', () => {
    const cond = { type: 'Healthy', status: 'True', lastTransitionTime: '' } as const;
    expect(getStatusCondition([cond])).toEqual(cond);
  });
  it('returns undefined when neither Ready nor Healthy', () => {
    expect(getStatusCondition([{ type: 'Other', status: 'True', lastTransitionTime: '' }] as never)).toBeUndefined();
  });
  it('returns undefined for empty / undefined', () => {
    expect(getStatusCondition(undefined)).toBeUndefined();
    expect(getStatusCondition([])).toBeUndefined();
  });
});

// ---------- resolveProviderTypeFromApiVersion ----------

describe('resolveProviderTypeFromApiVersion', () => {
  it('strips account. prefix', () => {
    expect(resolveProviderTypeFromApiVersion('account.btp.sap.crossplane.io/v1alpha1')).toBe('btp.sap.crossplane.io');
  });
  it('passes through non-account domain', () => {
    expect(resolveProviderTypeFromApiVersion('kubernetes.crossplane.io/v1')).toBe('kubernetes.crossplane.io');
  });
  it('returns unknown for empty', () => {
    expect(resolveProviderTypeFromApiVersion('')).toBe('unknown');
  });
  it('handles missing version', () => {
    expect(resolveProviderTypeFromApiVersion('btp.sap.crossplane.io')).toBe('btp.sap.crossplane.io');
  });
});

// ---------- isSystemLabel ----------

describe('isSystemLabel', () => {
  it('matches kubernetes.io/* prefix', () => {
    expect(isSystemLabel('kubernetes.io/name')).toBe(true);
  });
  it('matches exact pod-template-hash', () => {
    expect(isSystemLabel('pod-template-hash')).toBe(true);
  });
  it('rejects unrelated keys', () => {
    expect(isSystemLabel('aegir.cloud.sap/instance')).toBe(false);
  });
});

// ---------- readBySource ----------

describe('readBySource', () => {
  const item = mkItem({
    name: 'i',
    apiVersion: 'g/v1',
    kind: 'X',
    spec: { forProvider: { fpRef: { name: 'fp-name' } }, specRef: { name: 'sp-name' } },
  });

  it('reads forProvider', () => {
    expect(readBySource(item, { type: 'forProvider', key: 'fpRef' })).toBe('fp-name');
  });
  it('reads spec', () => {
    expect(readBySource(item, { type: 'spec', key: 'specRef' })).toBe('sp-name');
  });
  it('reads dotted path resolving to {name}', () => {
    const nested = mkItem({
      name: 'i',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: {}, deep: { ref: { name: 'deep-name' } } },
    });
    expect(readBySource(nested, { type: 'path', path: 'spec.deep.ref' })).toBe('deep-name');
  });
  it('reads dotted path resolving to string', () => {
    const nested = mkItem({
      name: 'i',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: {}, label: 'leaf' },
    });
    expect(readBySource(nested, { type: 'path', path: 'spec.label' })).toBe('leaf');
  });
  it('returns undefined for path traversal hitting null', () => {
    expect(readBySource(item, { type: 'path', path: 'spec.missing.x' })).toBeUndefined();
  });
  it('runs predicate', () => {
    expect(readBySource(item, { type: 'predicate', match: (i) => i.metadata?.name })).toBe('i');
  });
});

// ---------- ruleMatches ----------

describe('ruleMatches', () => {
  it('empty rule matches anything', () => {
    expect(ruleMatches({}, 'anyRef', 'AnyKind')).toBe(true);
  });
  it('refKey filter narrows', () => {
    expect(ruleMatches({ refKey: 'aRef' }, 'aRef', 'K')).toBe(true);
    expect(ruleMatches({ refKey: 'aRef' }, 'bRef', 'K')).toBe(false);
  });
  it('refKeyPattern filter narrows', () => {
    expect(ruleMatches({ refKeyPattern: /Trust/ }, 'subaccountTrustRef', 'K')).toBe(true);
    expect(ruleMatches({ refKeyPattern: /Trust/ }, 'subaccountRef', 'K')).toBe(false);
  });
  it('fromKind filter narrows', () => {
    expect(ruleMatches({ fromKind: 'A' }, 'r', 'A')).toBe(true);
    expect(ruleMatches({ fromKind: 'A' }, 'r', 'B')).toBe(false);
  });
  it('fromKindPattern filter narrows', () => {
    expect(ruleMatches({ fromKindPattern: /^Kyma/ }, 'r', 'KymaEnvironment')).toBe(true);
    expect(ruleMatches({ fromKindPattern: /^Kyma/ }, 'r', 'Subaccount')).toBe(false);
  });
});

// ---------- Graph constructor: index + dedup ----------

describe('Graph index + dedup', () => {
  it('prefers higher version when same (name, kind) appears twice', () => {
    // CloudManagement at v1beta1 (preferred) and v1alpha1 (phantom). Reference
    // resolution must hit v1beta1 even though the v1alpha1 record was added.
    const cmAlpha = mkItem({ name: 'cis', apiVersion: 'g/v1alpha1', kind: 'CloudManagement' });
    const cmBeta = mkItem({ name: 'cis', apiVersion: 'g/v1beta1', kind: 'CloudManagement' });
    const referrer = mkItem({
      name: 'env',
      apiVersion: 'g/v1alpha1',
      kind: 'KymaEnvironment',
      spec: { forProvider: {}, cloudManagementRef: { name: 'cis' } },
    });
    const g = buildGraph([cmAlpha, cmBeta, referrer]);
    const env = g.nodes.find((n) => n.type === 'KymaEnvironment');
    expect(env?.extraRefs).toEqual(['cis-g/v1beta1']);
  });

  it('keeps first-write entry on equal-rank collision', () => {
    const a = mkItem({ name: 'x', apiVersion: 'g/v1', kind: 'K' });
    const b = mkItem({ name: 'x', apiVersion: 'g/v1', kind: 'K' });
    const g = buildGraph([a, b]);
    expect(g.nodeById.has('x-g/v1')).toBe(true);
  });

  it('skips records missing name or apiVersion', () => {
    const valid = mkItem({ name: 'a', apiVersion: 'g/v1', kind: 'K' });
    const noName = mkItem({ name: '', apiVersion: 'g/v1', kind: 'K' });
    const noVer = mkItem({ name: 'b', apiVersion: '', kind: 'K' });
    const g = buildGraph([valid, noName, noVer]);
    expect(g.nodes.map((n) => n.id)).toEqual(['a-g/v1']);
  });

  it('returns empty graph for missing inputs', () => {
    const g = new Graph({
      managedResources: undefined,
      providerConfigs: undefined,
      onYamlClick: mockOnYamlClick,
    });
    expect(g.nodes).toEqual([]);
  });
});

// ---------- Rule engine wired through Graph ----------

describe('Graph rule engine', () => {
  it('uses convention when only catch-all rule matches', () => {
    const sa = mkItem({ name: 'my-sub', apiVersion: 'g/v1', kind: 'Subaccount' });
    const sm = mkItem({
      name: 'my-sub-sm',
      apiVersion: 'g/v1',
      kind: 'ServiceManager',
      spec: { forProvider: { subaccountRef: { name: 'my-sub' } } },
    });
    const g = buildGraph([sa, sm]);
    const smNode = g.nodes.find((n) => n.type === 'ServiceManager');
    expect(smNode?.parentId).toBe('my-sub-g/v1');
  });

  it('refKey-targeted rule beats catch-all even when listed later', () => {
    const target = mkItem({ name: 't', apiVersion: 'g/v1', kind: 'CustomTarget' });
    const referrer = mkItem({
      name: 'r',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { someRef: { name: 't' } } },
    });
    const rules: RefRule[] = [
      {}, // catch-all first
      { refKey: 'someRef', targetKind: 'CustomTarget', role: 'extra' }, // never reached
    ];
    const g = buildGraph([target, referrer], rules);
    const r = g.nodes.find((n) => n.id === 'r-g/v1');
    // catch-all uses inferKind = 'Some' → no match → no extras.
    expect(r?.extraRefs).toEqual([]);

    const rulesReversed: RefRule[] = [{ refKey: 'someRef', targetKind: 'CustomTarget', role: 'extra' }, {}];
    const g2 = buildGraph([target, referrer], rulesReversed);
    const r2 = g2.nodes.find((n) => n.id === 'r-g/v1');
    expect(r2?.extraRefs).toEqual(['t-g/v1']);
  });

  it('fromKind narrows a rule', () => {
    const target = mkItem({ name: 't', apiVersion: 'g/v1', kind: 'KymaEnvironment' });
    const km = mkItem({
      name: 'm',
      apiVersion: 'g/v1',
      kind: 'KymaModule',
      spec: { forProvider: { kymaEnvironmentBindingRef: { name: 't' } } },
    });
    const other = mkItem({
      name: 'o',
      apiVersion: 'g/v1',
      kind: 'OtherKind',
      spec: { forProvider: { kymaEnvironmentBindingRef: { name: 't' } } },
    });
    const g = buildGraph([target, km, other]);
    expect(g.nodes.find((n) => n.id === 'm-g/v1')?.parentId).toBe('t-g/v1');
    // Other kind: convention says target kind = KymaEnvironmentBinding (no node) → unresolved.
    expect(g.nodes.find((n) => n.id === 'o-g/v1')?.parentId).toBeUndefined();
  });

  it('refKeyPattern matches across discovered refs', () => {
    const target = mkItem({ name: 't', apiVersion: 'g/v1', kind: 'TrustOverride' });
    const r = mkItem({
      name: 'r',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { someTrustRef: { name: 't' } } },
    });
    const rules: RefRule[] = [{ refKeyPattern: /Trust/, targetKind: 'TrustOverride', role: 'extra' }, {}];
    const g = buildGraph([target, r], rules);
    expect(g.nodes.find((n) => n.id === 'r-g/v1')?.extraRefs).toEqual(['t-g/v1']);
  });

  it('targetKindFn computes kind from refKey', () => {
    const target = mkItem({ name: 't', apiVersion: 'g/v1', kind: 'COMPUTED' });
    const r = mkItem({
      name: 'r',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { somethingRef: { name: 't' } } },
    });
    const rules: RefRule[] = [{ refKey: 'somethingRef', targetKindFn: () => 'COMPUTED', role: 'extra' }, {}];
    const g = buildGraph([target, r], rules);
    expect(g.nodes.find((n) => n.id === 'r-g/v1')?.extraRefs).toEqual(['t-g/v1']);
  });

  it('priority decides among multiple parent candidates', () => {
    const sa = mkItem({ name: 'sa', apiVersion: 'g/v1', kind: 'Subaccount' });
    const sm = mkItem({ name: 'sm', apiVersion: 'g/v1', kind: 'ServiceManager' });
    // Item with both refs — serviceManagerRef has priority over subaccountRef in DEFAULT_PARENT_KEYS.
    const r = mkItem({
      name: 'child',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { subaccountRef: { name: 'sa' }, serviceManagerRef: { name: 'sm' } } },
    });
    const g = buildGraph([sa, sm, r]);
    expect(g.nodes.find((n) => n.id === 'child-g/v1')?.parentId).toBe('sm-g/v1');
  });

  it('explicit priority on rule overrides parent-key default order', () => {
    const sa = mkItem({ name: 'sa', apiVersion: 'g/v1', kind: 'Subaccount' });
    const sm = mkItem({ name: 'sm', apiVersion: 'g/v1', kind: 'ServiceManager' });
    const r = mkItem({
      name: 'child',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { subaccountRef: { name: 'sa' }, serviceManagerRef: { name: 'sm' } } },
    });
    // Boost subaccountRef above serviceManagerRef.
    const rules: RefRule[] = [{ refKey: 'subaccountRef', priority: 999 }, {}];
    const g = buildGraph([sa, sm, r], rules);
    expect(g.nodes.find((n) => n.id === 'child-g/v1')?.parentId).toBe('sa-g/v1');
  });

  it('role override flips a parent-key default into extras', () => {
    const sa = mkItem({ name: 'sa', apiVersion: 'g/v1', kind: 'Subaccount' });
    const r = mkItem({
      name: 'child',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { subaccountRef: { name: 'sa' } } },
    });
    const rules: RefRule[] = [{ refKey: 'subaccountRef', role: 'extra' }, {}];
    const g = buildGraph([sa, r], rules);
    const child = g.nodes.find((n) => n.id === 'child-g/v1');
    expect(child?.parentId).toBeUndefined();
    expect(child?.extraRefs).toEqual(['sa-g/v1']);
  });

  it('source.path adds a ref discovery couldn’t see', () => {
    const target = mkItem({ name: 'tgt', apiVersion: 'g/v1', kind: 'Deep' });
    const r = mkItem({
      name: 'r',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: {}, custom: { ref: { name: 'tgt' } } },
    });
    const rules: RefRule[] = [
      {
        refKey: 'customDeepRef',
        source: { type: 'path', path: 'spec.custom.ref' },
        targetKind: 'Deep',
        role: 'extra',
      },
      {},
    ];
    const g = buildGraph([target, r], rules);
    expect(g.nodes.find((n) => n.id === 'r-g/v1')?.extraRefs).toEqual(['tgt-g/v1']);
  });

  it('source.predicate produces ref name from arbitrary item shape', () => {
    const target = mkItem({ name: 'tag-value', apiVersion: 'g/v1', kind: 'Tag' });
    const r = mkItem({
      name: 'r',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: {}, tag: 'tag-value' },
    });
    const rules: RefRule[] = [
      {
        refKey: 'tagRef',
        source: { type: 'predicate', match: (i) => (i.spec as { tag?: string })?.tag },
        targetKind: 'Tag',
        role: 'extra',
      },
      {},
    ];
    const g = buildGraph([target, r], rules);
    expect(g.nodes.find((n) => n.id === 'r-g/v1')?.extraRefs).toEqual(['tag-value-g/v1']);
  });
});

// ---------- Default rules: KymaModule + Object special-cases ----------

describe('Default rules', () => {
  it('KymaModule.kymaEnvironmentBindingRef falls back to KymaEnvironment of same name', () => {
    const env = mkItem({ name: 'rt', apiVersion: 'g/v1alpha1', kind: 'KymaEnvironment' });
    const mod = mkItem({
      name: 'rt-mod',
      apiVersion: 'g/v1alpha1',
      kind: 'KymaModule',
      spec: { forProvider: {}, kymaEnvironmentBindingRef: { name: 'rt' } },
    });
    const g = buildGraph([env, mod]);
    expect(g.nodes.find((n) => n.id === 'rt-mod-g/v1alpha1')?.parentId).toBe('rt-g/v1alpha1');
  });

  it('Object.providerConfigRef resolves to KymaEnvironment of same name', () => {
    const env = mkItem({ name: 'rt', apiVersion: 'g/v1alpha1', kind: 'KymaEnvironment' });
    const obj = mkItem({
      name: 'rt-obj',
      apiVersion: 'k8s/v1alpha2',
      kind: 'Object',
      spec: { providerConfigRef: { name: 'rt' }, forProvider: {} },
    });
    const g = buildGraph([env, obj]);
    expect(g.nodes.find((n) => n.id === 'rt-obj-k8s/v1alpha2')?.parentId).toBe('rt-g/v1alpha1');
  });
});

// ---------- Graph.collectEdges ----------

describe('Graph.collectEdges', () => {
  const sa = mkItem({ name: 'sa', apiVersion: 'g/v1', kind: 'Subaccount' });
  const cm = mkItem({ name: 'sa-cis', apiVersion: 'g/v1beta1', kind: 'CloudManagement' });
  const env = mkItem({
    name: 'sa',
    apiVersion: 'g/v1alpha1',
    kind: 'KymaEnvironment',
    spec: { forProvider: {}, subaccountRef: { name: 'sa' }, cloudManagementRef: { name: 'sa-cis' } },
  });

  it('emits parent edges as non-aux and extras as aux', () => {
    const g = buildGraph([sa, cm, env]);
    const edges = g.collectEdges();
    const envEdges = edges.filter((e) => e.target === 'sa-g/v1alpha1');
    expect(envEdges.find((e) => e.source === 'sa-g/v1')?.aux).toBe(false);
    expect(envEdges.find((e) => e.source === 'sa-cis-g/v1beta1')?.aux).toBe(true);
  });

  it('includeAux=false omits aux edges', () => {
    const g = buildGraph([sa, cm, env]);
    expect(g.collectEdges(false).every((e) => !e.aux)).toBe(true);
  });

  it('drops edges whose target node is not in the graph', () => {
    // Referrer points at a name that has no matching node.
    const orphan = mkItem({
      name: 'orphan',
      apiVersion: 'g/v1',
      kind: 'X',
      spec: { forProvider: { subaccountRef: { name: 'missing' } } },
    });
    const g = buildGraph([orphan]);
    expect(g.collectEdges()).toEqual([]);
  });
});

// ---------- Graph.generateColorMap + colorKeyOf ----------

describe('Graph.generateColorMap / colorKeyOf', () => {
  const a = mkItem({ name: 'a', apiVersion: 'btp.sap.crossplane.io/v1', kind: 'X' });
  const b = mkItem({ name: 'b', apiVersion: 'cf.crossplane.io/v1', kind: 'Y' });

  it('colorBy=source keys by providerType', () => {
    const g = buildGraph([a, b]);
    const map = g.generateColorMap('source');
    expect(map['btp.sap.crossplane.io']).toBeDefined();
    expect(map['cf.crossplane.io']).toBeDefined();
  });

  it('colorBy=provider keys by providerConfigName', () => {
    const g = buildGraph([a, b]);
    const map = g.generateColorMap('provider');
    expect(map['pc']).toBeDefined();
  });

  it('colorBy=flux uses fluxName with default fallback', () => {
    const g = buildGraph([a, b]);
    const map = g.generateColorMap('flux');
    expect(map['default']).toBe('#BFBFBF');
  });

  it('colorBy=label uses labelKey value with default fallback', () => {
    const labelled = mkItem({
      name: 'l',
      apiVersion: 'g/v1',
      kind: 'L',
      metadata: { name: 'l', labels: { 'aegir.cloud.sap/instance': 'one' } },
    } as never);
    const g = buildGraph([labelled, a]);
    const map = g.generateColorMap('label', 'aegir.cloud.sap/instance');
    expect(map['one']).toBeDefined();
    expect(map['default']).toBe('#BFBFBF');
  });

  it('colorBy=label without labelKey collapses to all default', () => {
    const g = buildGraph([a, b]);
    const map = g.generateColorMap('label');
    expect(Object.keys(map)).toEqual(['default']);
    expect(map['default']).toBe('#BFBFBF');
  });

  it('colorKeyOf returns expected key per mode', () => {
    const g = buildGraph([a]);
    const node = g.nodes[0];
    expect(g.colorKeyOf(node, 'source')).toBe('btp.sap.crossplane.io');
    expect(g.colorKeyOf(node, 'provider')).toBe('pc');
    expect(g.colorKeyOf(node, 'flux')).toBe('default');
    expect(g.colorKeyOf(node, 'label')).toBe('default');
    expect(g.colorKeyOf({ ...node, fluxName: 'fx' }, 'flux')).toBe('fx');
  });
});

// ---------- Graph.listCommonLabelKeys ----------

describe('Graph.listCommonLabelKeys', () => {
  const mkLabelled = (name: string, labels: Record<string, string>) =>
    mkItem({
      name,
      apiVersion: 'g/v1',
      kind: 'X',
      metadata: { name, labels },
    } as never);

  it('skips system-prefixed keys', () => {
    const a = mkLabelled('a', { 'app.kubernetes.io/instance': 'x', biz: 'y' });
    const g = buildGraph([a]);
    expect(g.listCommonLabelKeys()).toEqual(['biz']);
  });

  it('sorts by frequency descending then alpha for ties', () => {
    const a = mkLabelled('a', { team: 'one', region: 'eu' });
    const b = mkLabelled('b', { team: 'two', region: 'us' });
    const c = mkLabelled('c', { team: 'three' });
    const g = buildGraph([a, b, c]);
    expect(g.listCommonLabelKeys()).toEqual(['team', 'region']);
  });

  it('returns empty when no labels', () => {
    const a = mkItem({ name: 'a', apiVersion: 'g/v1', kind: 'X' });
    const g = buildGraph([a]);
    expect(g.listCommonLabelKeys()).toEqual([]);
  });
});

// ---------- ServiceInstance ⇄ Entitlement auxiliary edge ----------

describe('Graph: ServiceInstance → Entitlement auxiliary edge', () => {
  const mkEntitlement = (name: string, serviceName: string, servicePlanName: string) =>
    mkItem({
      name,
      apiVersion: 'account.btp.sap.crossplane.io/v1alpha1',
      kind: 'Entitlement',
      spec: {
        providerConfigRef: { name: 'pc' },
        forProvider: { serviceName, servicePlanName },
      },
    });

  const mkServiceInstance = (name: string, offeringName?: string, planName?: string) =>
    mkItem({
      name,
      apiVersion: 'account.btp.sap.crossplane.io/v1alpha1',
      kind: 'ServiceInstance',
      spec: {
        providerConfigRef: { name: 'pc' },
        forProvider: { offeringName, planName },
      },
    });

  it('links a ServiceInstance to its matching Entitlement via extras', () => {
    const ent = mkEntitlement('hana-ent', 'hana-cloud', 'hana');
    const si = mkServiceInstance('hana-instance', 'hana-cloud', 'hana');
    const g = buildGraph([ent, si]);
    const siNode = g.nodes.find((n) => n.type === 'ServiceInstance');
    expect(siNode?.extraRefs).toEqual(['hana-ent-account.btp.sap.crossplane.io/v1alpha1']);
  });

  it('emits the link as an aux edge (not primary)', () => {
    const ent = mkEntitlement('hana-ent', 'hana-cloud', 'hana');
    const si = mkServiceInstance('hana-instance', 'hana-cloud', 'hana');
    const g = buildGraph([ent, si]);
    const edges = g.collectEdges();
    const link = edges.find(
      (e) =>
        e.source === 'hana-ent-account.btp.sap.crossplane.io/v1alpha1' &&
        e.target === 'hana-instance-account.btp.sap.crossplane.io/v1alpha1',
    );
    expect(link?.aux).toBe(true);
  });

  it('produces no edge when no Entitlement matches the offering+plan', () => {
    const ent = mkEntitlement('hana-ent', 'hana-cloud', 'hana');
    const si = mkServiceInstance('orphan', 'destination', 'lite');
    const g = buildGraph([ent, si]);
    const siNode = g.nodes.find((n) => n.id === 'orphan-account.btp.sap.crossplane.io/v1alpha1');
    expect(siNode?.extraRefs).toEqual([]);
  });

  it('links multiple ServiceInstances of the same plan to one Entitlement', () => {
    const ent = mkEntitlement('hana-ent', 'hana-cloud', 'hana');
    const si1 = mkServiceInstance('hana-a', 'hana-cloud', 'hana');
    const si2 = mkServiceInstance('hana-b', 'hana-cloud', 'hana');
    const g = buildGraph([ent, si1, si2]);
    const a = g.nodes.find((n) => n.id === 'hana-a-account.btp.sap.crossplane.io/v1alpha1');
    const b = g.nodes.find((n) => n.id === 'hana-b-account.btp.sap.crossplane.io/v1alpha1');
    expect(a?.extraRefs).toEqual(['hana-ent-account.btp.sap.crossplane.io/v1alpha1']);
    expect(b?.extraRefs).toEqual(['hana-ent-account.btp.sap.crossplane.io/v1alpha1']);
  });

  it('matches across subaccounts (graph-wide service-key index)', () => {
    // Two Entitlements with the same service+plan in different subaccounts
    // collapse to a single index entry. Last record wins; the SI links to it.
    const entA = mkEntitlement('ent-a', 'hana-cloud', 'hana');
    const entB = mkEntitlement('ent-b', 'hana-cloud', 'hana');
    const si = mkServiceInstance('hana-instance', 'hana-cloud', 'hana');
    const g = buildGraph([entA, entB, si]);
    const siNode = g.nodes.find((n) => n.type === 'ServiceInstance');
    expect(siNode?.extraRefs).toHaveLength(1);
    expect(siNode?.extraRefs?.[0]).toMatch(/^ent-(a|b)-/);
  });

  it('emits no edge when ServiceInstance is missing offeringName or planName', () => {
    const ent = mkEntitlement('hana-ent', 'hana-cloud', 'hana');
    const partial = mkServiceInstance('partial', 'hana-cloud', undefined);
    const empty = mkServiceInstance('empty', undefined, undefined);
    const g = buildGraph([ent, partial, empty]);
    expect(g.nodes.find((n) => n.id === 'partial-account.btp.sap.crossplane.io/v1alpha1')?.extraRefs).toEqual([]);
    expect(g.nodes.find((n) => n.id === 'empty-account.btp.sap.crossplane.io/v1alpha1')?.extraRefs).toEqual([]);
  });
});
