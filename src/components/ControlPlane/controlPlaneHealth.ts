import type { ControlPlaneCondition } from '../../spaces/onboarding/types/ControlPlane.ts';

// Condition vocabulary of openmcp-operator `core.open-control-plane.io/v2alpha1 ControlPlane`
// (api/core/v2alpha1/constants.go). Its `phase` is only Ready | Progressing | Terminating — a real
// failure surfaces as `Progressing` plus a False condition carrying one of the problem reasons below.
const CONDITION_META = 'Meta';
const CONDITION_CLUSTER_REQUEST_READY = 'ClusterRequestReady';
const CONDITION_CLUSTER_CONDITIONS_SYNCED = 'ClusterConditionsSynced';
const PREFIX_CLUSTER = 'Cluster.';
const PREFIX_ACCESS_READY = 'AccessReady.';
const CONDITION_ALL_ACCESS_READY = 'AllAccessReady';
const CONDITION_ALL_SERVICES_DELETED = 'AllServicesDeleted';
const CONDITION_ALL_CLUSTER_REQUESTS_DELETED = 'AllClusterRequestsDeleted';

const PHASE_READY = 'Ready';
const PHASE_TERMINATING = 'Terminating';
const SERVICE_PROGRESS_PHASES = new Set(['', 'Progressing', 'Initializing', 'Requested', 'Pending']);
const PROBLEM_REASONS = new Set(['InternalError', 'InvalidReference', 'ClusterConflict', 'UnknownLandscape']);

const I18N = 'ControlPlaneStatus';

export const SERVICE_KEYS = ['crossplane', 'flux', 'landscaper', 'externalSecretsOperator', 'ocm', 'kro'] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];
export type ServicePhases = Partial<Record<ServiceKey, { phase?: string | null } | undefined>>;

export type HealthTone = 'ok' | 'progress' | 'error' | 'deleting' | 'pending';
export type OverallHealthState = 'ready' | 'settingUp' | 'attention' | 'deleting' | 'unknown';
export type HealthGroupId = 'platform' | 'cluster' | 'access' | 'services' | 'deletion';

export interface HealthLabel {
  key: string;
  params?: Record<string, string | number>;
}

export interface HealthItem {
  id: string;
  label: HealthLabel;
  tone: HealthTone;
  status?: HealthLabel;
  message?: string;
  since?: string;
}

export interface HealthGroup {
  id: HealthGroupId;
  tone: HealthTone;
  summary: HealthLabel;
  /** Only the items worth showing to the user (problems / pending work, or every step while deleting). */
  items: HealthItem[];
}

export interface ControlPlaneHealth {
  state: OverallHealthState;
  headline: { label: HealthLabel; detail?: string; since?: string };
  groups: HealthGroup[];
}

export interface ControlPlaneHealthInput {
  phase?: string | null;
  conditions?: ControlPlaneCondition[] | null;
  deletionTimestamp?: string | null;
  services?: ServicePhases;
}

const TONE_RANK: Record<HealthTone, number> = { ok: 0, pending: 1, deleting: 2, progress: 3, error: 4 };

const worstTone = (tones: HealthTone[]): HealthTone =>
  tones.reduce<HealthTone>((worst, tone) => (TONE_RANK[tone] > TONE_RANK[worst] ? tone : worst), 'ok');

const label = (key: string, params?: HealthLabel['params']): HealthLabel => ({ key: `${I18N}.${key}`, params });

export function isProblemReason(reason?: string | null): boolean {
  if (!reason) return false;
  return reason.endsWith('Problem') || PROBLEM_REASONS.has(reason);
}

function conditionTone(condition: ControlPlaneCondition): HealthTone {
  if (condition.status === 'True') return 'ok';
  return isProblemReason(condition.reason) ? 'error' : 'progress';
}

/** `Cluster.Gardener_APIServerAvailable` → `API server available`. */
export function humanizeConditionType(type: string): string {
  const words = type
    .replace(/^Cluster\./, '')
    .replace(/^Gardener_/, '')
    .replace(/[._]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(/\s+/);
  return words
    .map((word, index) => {
      if (index === 0 || /^[A-Z0-9]{2,}$/.test(word)) return word;
      return word.toLowerCase();
    })
    .join(' ');
}

export function accessEntryLabel(entry: string): HealthLabel {
  if (entry === 'oidc_openmcp') return label('accessDefaultIdp');
  if (entry.startsWith('oidc_')) return label('accessIdp', { name: entry.slice('oidc_'.length) });
  if (entry.startsWith('token_')) return label('accessToken', { name: entry.slice('token_'.length) });
  return label('itemGeneric', { name: entry });
}

function conditionItem(condition: ControlPlaneCondition, itemLabel: HealthLabel): HealthItem {
  return {
    id: condition.type,
    label: itemLabel,
    tone: conditionTone(condition),
    message: condition.message || undefined,
    since: condition.lastTransitionTime || undefined,
  };
}

const notOk = (item: HealthItem) => item.tone !== 'ok';

function buildClusterGroup(conditions: ControlPlaneCondition[], expectPending: boolean): HealthGroup | null {
  const byType = (type: string) => conditions.find((c) => c.type === type);
  const request = byType(CONDITION_CLUSTER_REQUEST_READY);
  const synced = byType(CONDITION_CLUSTER_CONDITIONS_SYNCED);
  const mirrored = conditions
    .filter((c) => c.type.startsWith(PREFIX_CLUSTER))
    .sort((a, b) => a.type.localeCompare(b.type));

  const all: HealthItem[] = [
    ...(request ? [conditionItem(request, label('itemClusterRequest'))] : []),
    ...(synced ? [conditionItem(synced, label('itemClusterSync'))] : []),
    ...mirrored.map((c) => conditionItem(c, label('itemGeneric', { name: humanizeConditionType(c.type) }))),
  ];

  if (all.length === 0) {
    return expectPending ? { id: 'cluster', tone: 'pending', summary: label('summaryPending'), items: [] } : null;
  }

  const tone = worstTone(all.map((i) => i.tone));
  const summaryKey = tone === 'ok' ? 'clusterRunning' : tone === 'error' ? 'clusterProblem' : 'clusterProvisioning';
  return { id: 'cluster', tone, summary: label(summaryKey), items: all.filter(notOk) };
}

function buildAccessGroup(conditions: ControlPlaneCondition[], expectPending: boolean): HealthGroup | null {
  const entries = conditions
    .filter((c) => c.type.startsWith(PREFIX_ACCESS_READY))
    .sort((a, b) => a.type.localeCompare(b.type))
    .map((c) => conditionItem(c, accessEntryLabel(c.type.slice(PREFIX_ACCESS_READY.length))));
  const aggregate = conditions.find((c) => c.type === CONDITION_ALL_ACCESS_READY);
  const aggregateItem = aggregate ? conditionItem(aggregate, label('accessAll')) : undefined;

  // The aggregate only adds information when no individual entry explains a failure (e.g. a
  // ConfigurationProblem that isn't tied to one identity provider).
  const all =
    aggregateItem && (entries.length === 0 || (notOk(aggregateItem) && !entries.some(notOk)))
      ? [...entries, aggregateItem]
      : entries;

  if (all.length === 0) {
    return expectPending ? { id: 'access', tone: 'pending', summary: label('summaryPending'), items: [] } : null;
  }

  const tone = worstTone(all.map((i) => i.tone));
  const counted = entries.length > 0 ? entries : all;
  const ready = counted.filter((i) => i.tone === 'ok').length;
  const summary =
    tone === 'ok'
      ? label('accessReady')
      : tone === 'error'
        ? label('accessProblem')
        : label('accessPartial', { ready, total: counted.length });
  return { id: 'access', tone, summary, items: all.filter(notOk) };
}

function serviceTone(phase: string): HealthTone {
  if (phase === PHASE_READY) return 'ok';
  if (phase === PHASE_TERMINATING) return 'deleting';
  if (SERVICE_PROGRESS_PHASES.has(phase)) return 'progress';
  return 'error';
}

const SERVICE_STATUS_KEY: Record<HealthTone, string> = {
  ok: 'ControlPlaneCard.serviceReady',
  progress: 'ControlPlaneCard.serviceInstalling',
  deleting: 'ControlPlaneCard.serviceDeleting',
  error: 'ControlPlaneCard.serviceUnknown',
  pending: 'ControlPlaneCard.serviceUnknown',
};

function buildServicesGroup(services: ServicePhases | undefined): HealthGroup | null {
  if (!services) return null;
  const all: HealthItem[] = SERVICE_KEYS.flatMap((key) => {
    const service = services[key];
    if (!service) return [];
    const phase = service.phase ?? '';
    const tone = serviceTone(phase);
    return [
      {
        id: key,
        label: { key: `ServiceSelectionStep.${key}` },
        tone,
        status: tone === 'error' ? undefined : { key: SERVICE_STATUS_KEY[tone] },
        message: tone === 'error' ? phase : undefined,
      },
    ];
  });
  if (all.length === 0) return null;

  const tone = worstTone(all.map((i) => i.tone));
  const ready = all.filter((i) => i.tone === 'ok').length;
  const summary =
    tone === 'ok'
      ? label('servicesReady', { count: all.length, total: all.length })
      : tone === 'error'
        ? label('servicesProblem')
        : label('servicesPartial', { ready, total: all.length });
  return { id: 'services', tone, summary, items: all.filter(notOk) };
}

const KNOWN_TYPES = new Set([
  CONDITION_META,
  CONDITION_CLUSTER_REQUEST_READY,
  CONDITION_CLUSTER_CONDITIONS_SYNCED,
  CONDITION_ALL_ACCESS_READY,
  CONDITION_ALL_SERVICES_DELETED,
  CONDITION_ALL_CLUSTER_REQUESTS_DELETED,
]);

const isKnownType = (type: string) =>
  KNOWN_TYPES.has(type) || type.startsWith(PREFIX_CLUSTER) || type.startsWith(PREFIX_ACCESS_READY);

function buildPlatformGroup(conditions: ControlPlaneCondition[]): HealthGroup | null {
  const items = conditions
    .filter((c) => c.type === CONDITION_META || !isKnownType(c.type))
    .map((c) =>
      conditionItem(
        c,
        c.type === CONDITION_META
          ? label('itemPlatform')
          : label('itemGeneric', { name: humanizeConditionType(c.type) }),
      ),
    )
    .filter(notOk);
  if (items.length === 0) return null;
  const tone = worstTone(items.map((i) => i.tone));
  return {
    id: 'platform',
    tone,
    summary: label(tone === 'error' ? 'platformProblem' : 'platformPreparing'),
    items,
  };
}

function buildDeletionGroup(conditions: ControlPlaneCondition[]): HealthGroup {
  const steps: [string, string][] = [
    [CONDITION_ALL_SERVICES_DELETED, 'deletionServices'],
    [CONDITION_ALL_CLUSTER_REQUESTS_DELETED, 'deletionCluster'],
    [CONDITION_META, 'deletionCleanup'],
  ];
  let reachedActiveStep = false;
  const items = steps.map(([type, key]): HealthItem => {
    const condition = conditions.find((c) => c.type === type);
    const tone: HealthTone = reachedActiveStep
      ? 'pending'
      : condition?.status === 'True'
        ? 'ok'
        : condition
          ? conditionTone(condition)
          : 'pending';
    if (tone !== 'ok') reachedActiveStep = true;
    const statusKey = tone === 'ok' ? 'stepDone' : tone === 'pending' ? 'stepPending' : 'stepInProgress';
    return {
      id: type,
      label: label(key),
      tone,
      status: label(statusKey),
      message: tone === 'ok' || tone === 'pending' ? undefined : condition?.message || undefined,
      since: condition?.lastTransitionTime || undefined,
    };
  });
  const tone = items.some((i) => i.tone === 'error') ? 'error' : 'deleting';
  return { id: 'deletion', tone, summary: label('deletionSummary'), items };
}

const HEADLINE_PROBLEM: Record<HealthGroupId, string> = {
  platform: 'headlinePlatformProblem',
  cluster: 'headlineClusterProblem',
  access: 'headlineAccessProblem',
  services: 'headlineServicesProblem',
  deletion: 'headlineDeletionProblem',
};

const HEADLINE_PROGRESS: Record<HealthGroupId, string> = {
  platform: 'headlinePlatformPreparing',
  cluster: 'headlineClusterProvisioning',
  access: 'headlineAccessPreparing',
  services: 'headlineServicesInstalling',
  deletion: 'headlineDeleting',
};

function latest(conditions: ControlPlaneCondition[]): string | undefined {
  return conditions
    .map((c) => c.lastTransitionTime)
    .filter((t): t is string => !!t && !isNaN(new Date(t).getTime()))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function firstItem(groups: HealthGroup[], tones: HealthTone[]) {
  for (const group of groups) {
    const item = group.items.find((i) => tones.includes(i.tone));
    if (item) return { group, item };
  }
  return undefined;
}

export function deriveControlPlaneHealth({
  phase,
  conditions: rawConditions,
  deletionTimestamp,
  services,
}: ControlPlaneHealthInput): ControlPlaneHealth {
  const conditions = rawConditions ?? [];

  if (deletionTimestamp || phase === PHASE_TERMINATING) {
    const deletion = buildDeletionGroup(conditions);
    const problem = deletion.items.find((i) => i.tone === 'error');
    const active = problem ?? deletion.items.find((i) => i.tone === 'progress');
    return {
      state: 'deleting',
      headline: {
        label: label(problem ? HEADLINE_PROBLEM.deletion : HEADLINE_PROGRESS.deletion),
        detail: active?.message,
        since: active?.since ?? deletionTimestamp ?? undefined,
      },
      groups: [deletion],
    };
  }

  if (!phase && conditions.length === 0) {
    return { state: 'unknown', headline: { label: label('headlineUnknown') }, groups: [] };
  }

  const expectPending = phase !== PHASE_READY;
  // Pipeline order — the first non-ok item in this order is what blocks the control plane.
  const groups = [
    buildPlatformGroup(conditions),
    buildClusterGroup(conditions, expectPending),
    buildAccessGroup(conditions, expectPending),
    buildServicesGroup(services),
  ].filter((g): g is HealthGroup => g !== null);

  const problem = firstItem(groups, ['error']);
  if (problem) {
    return {
      state: 'attention',
      headline: {
        label: label(HEADLINE_PROBLEM[problem.group.id]),
        detail: problem.item.message,
        since: problem.item.since,
      },
      groups,
    };
  }

  const progress = firstItem(groups, ['progress', 'deleting']);
  if (phase === PHASE_READY && !progress) {
    return { state: 'ready', headline: { label: label('headlineReady'), since: latest(conditions) }, groups };
  }

  return {
    state: 'settingUp',
    headline: progress
      ? {
          label: label(HEADLINE_PROGRESS[progress.group.id]),
          detail: progress.item.message,
          since: progress.item.since,
        }
      : { label: label('headlineSettingUp'), since: latest(conditions) },
    groups,
  };
}
