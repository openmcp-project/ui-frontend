import { Condition, ManagedResourceGroup, ManagedResourceItem, ProviderConfigs } from '../../lib/shared/types';
import { NodeData } from './types';

export type StatusType = 'ERROR' | 'OK';

export const getStatusCondition = (conditions?: Condition[]): Condition | undefined => {
  if (!conditions || !Array.isArray(conditions)) return undefined;
  return conditions.find((c) => c.type === 'Ready' || c.type === 'Healthy');
};

export const resolveProviderTypeFromApiVersion = (apiVersion: string): string => {
  // Extract domain from apiVersion (e.g. "account.btp.sap.crossplane.io/v1alpha1" -> "account.btp.sap.crossplane.io")
  const domain = apiVersion?.split('/')[0] || '';

  // Remove "account" to normalize provider names
  // e.g "account.btp.sap.crossplane.io" -> "btp.sap.crossplane.io"
  const normalizedDomain = domain.replace(/^account\./, '');

  return normalizedDomain || 'unknown';
};

export const generateColorMap = (items: NodeData[], colorBy: string): Record<string, string> => {
  const colors = [
    '#FFC933', // MANGO 4
    '#FF8AF0', // PINK 4
    '#FEADC8', // RASPBERRY 4
    '#2CE0BF', // TEAL 4
    '#FF8CB2', // RED 4
    '#B894FF', // INDIGO 4
    '#049F9A', // TEAL 6
    '#FA4F96', // RASPBERRY 6
    '#F31DED', // PINK 6
    '#7858FF', // INDIGO 6
    '#07838F', // TEAL 7
    '#DF1278', // RASBERRY 7
    '#510080', // PINK 10
    '#5D36FF', // INDIGO 7
  ];

  const keys = (() => {
    if (colorBy === 'source') return Array.from(new Set(items.map((i) => i.providerType).filter(Boolean)));
    if (colorBy === 'flux') return Array.from(new Set(items.map((i) => i.fluxName ?? 'default')));
    return Array.from(new Set(items.map((i) => i.providerConfigName).filter(Boolean)));
  })();

  const map = new Map<string, string>();
  keys.forEach((key, i) => {
    map.set(key, colors[i % colors.length]);
  });

  if (colorBy === 'flux' && keys.includes('default')) {
    map.set('default', '#BFBFBF');
  }

  return Object.fromEntries(map);
};

// Maps spec ref field name to the kind of resource it points to.
// Used to resolve a `*Ref.name` to the actual node id, since referencing item
// and target may live in different API groups/versions.
const REF_TARGET_KIND: Record<string, string> = {
  subaccountRef: 'Subaccount',
  serviceManagerRef: 'ServiceManager',
  cloudManagementRef: 'CloudManagement',
  spaceRef: 'Space',
  orgRef: 'Org',
  directoryRef: 'Directory',
  entitlementRef: 'Entitlement',
  globalAccountRef: 'GlobalAccount',
  orgRoleRef: 'OrgRole',
  spaceMembersRef: 'SpaceMembers',
  cloudFoundryEnvironmentRef: 'CloudFoundryEnvironment',
  kymaEnvironmentRef: 'KymaEnvironment',
  kymaEnvironmentBindingRef: 'KymaEnvironmentBinding',
  roleCollectionRef: 'RoleCollection',
  roleCollectionAssignmentRef: 'RoleCollectionAssignment',
  subaccountTrustConfigurationRef: 'SubaccountTrustConfiguration',
  globalaccountTrustConfigurationRef: 'GlobalaccountTrustConfiguration',
};

const PARENT_REF_PRIORITY = ['serviceManagerRef', 'subaccountRef', 'kymaEnvironmentBindingRef'];

const EXTRA_REF_KEYS = [
  'spaceRef',
  'orgRef',
  'cloudManagementRef',
  'directoryRef',
  'entitlementRef',
  'globalAccountRef',
  'orgRoleRef',
  'spaceMembersRef',
  'cloudFoundryEnvironmentRef',
  'kymaEnvironmentRef',
  'roleCollectionRef',
  'roleCollectionAssignmentRef',
  'subaccountTrustConfigurationRef',
  'globalaccountTrustConfigurationRef',
];

const readRefName = (item: ManagedResourceItem, key: string): string | undefined => {
  const spec = item?.spec as Record<string, unknown> | undefined;
  const forProvider = spec?.forProvider as Record<string, unknown> | undefined;
  const fromForProvider = (forProvider?.[key] as { name?: string } | undefined)?.name;
  const fromSpec = (spec?.[key] as { name?: string } | undefined)?.name;
  return fromForProvider ?? fromSpec;
};

export function extractRefs(item: ManagedResourceItem): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of Object.keys(REF_TARGET_KIND)) {
    out[key] = readRefName(item, key);
  }
  return out;
}

type ItemRecord = {
  item: ManagedResourceItem;
  name: string;
  kind: string;
  apiVersion: string;
  id: string;
};

export function buildTreeData(
  managedResources: ManagedResourceGroup[] | undefined,
  providerConfigsList: ProviderConfigs[],
  onYamlClick: (item: ManagedResourceItem) => void,
): NodeData[] {
  if (!managedResources || !providerConfigsList) return [];

  // Pass 1: flatten all items, build name+kind index for ref resolution.
  const records: ItemRecord[] = [];
  managedResources.forEach((group: ManagedResourceGroup) => {
    group.items?.forEach((item: ManagedResourceItem) => {
      const name = item?.metadata?.name;
      const apiVersion = item?.apiVersion ?? '';
      const kind = item?.kind ?? '';
      if (!name || !apiVersion) return;
      records.push({ item, name, kind, apiVersion, id: `${name}-${apiVersion}` });
    });
  });

  const idByNameAndKind = new Map<string, string>();
  records.forEach((r) => {
    idByNameAndKind.set(`${r.name}::${r.kind}`, r.id);
  });

  const resolveRef = (refName: string | undefined, targetKind: string | undefined): string | undefined => {
    if (!refName || !targetKind) return undefined;
    return idByNameAndKind.get(`${refName}::${targetKind}`);
  };

  // Pass 2: build node data with refs resolved against the index.
  const allNodesMap = new Map<string, NodeData>();
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

    const refs = extractRefs(item);

    let parentId: string | undefined;
    for (const refKey of PARENT_REF_PRIORITY) {
      const candidate = resolveRef(refs[refKey], REF_TARGET_KIND[refKey]);
      if (candidate) {
        parentId = candidate;
        break;
      }
    }

    // KymaModule's binding ref points to a KymaEnvironmentBinding, which is not
    // a managed-resource node. Fall back to the KymaEnvironment of the same name.
    if (!parentId && kind === 'KymaModule') {
      parentId = resolveRef(refs.kymaEnvironmentBindingRef, 'KymaEnvironment');
    }

    // Object (kubernetes.crossplane.io) has no structural ref to other managed
    // resources, but its providerConfigRef.name typically matches the
    // KymaEnvironment whose kubeconfig the k8s ProviderConfig consumes.
    if (!parentId && kind === 'Object') {
      parentId = resolveRef(item?.spec?.providerConfigRef?.name, 'KymaEnvironment');
    }

    const extraRefs = EXTRA_REF_KEYS.map((refKey) => resolveRef(refs[refKey], REF_TARGET_KIND[refKey])).filter(
      Boolean,
    ) as string[];

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
      parentId,
      extraRefs,
      item,
      onYamlClick,
    });
  });

  return Array.from(allNodesMap.values());
}
