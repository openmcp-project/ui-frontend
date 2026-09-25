import { useMemo } from 'react';
import { stringify } from 'yaml';
import {
  DISPLAY_NAME_ANNOTATION,
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  SUPPORT_LANDSCAPE_ANNOTATION,
  SUPPORT_OPS_CONTACTS_ANNOTATION,
  SUPPORT_SECURITY_CONTACTS_ANNOTATION,
  SUPPORT_SERVICE_IDS_ANNOTATION,
} from '../lib/api/types/shared/keyNames.ts';
import { Member } from '../lib/api/types/shared/members.ts';

type ResourceType = 'project' | 'workspace';

export interface YamlPreviewFields {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
  supportServiceIds?: string;
  supportLandscape?: string;
  supportSecurityContacts?: string;
  supportOpsContacts?: string;
}

const buildMembers = (members: Member[]) =>
  members
    .filter((m) => !!m.name)
    .map(({ kind, name, roles, namespace }) => ({
      kind,
      name,
      roles,
      ...(kind === 'ServiceAccount' ? { namespace: namespace ?? 'default' } : {}),
    }));

export function useYamlPreview(fields: YamlPreviewFields, type: ResourceType, projectNamespace?: string) {
  const {
    name,
    displayName,
    chargingTarget,
    chargingTargetType,
    members,
    supportServiceIds,
    supportLandscape,
    supportSecurityContacts,
    supportOpsContacts,
  } = fields;

  return useMemo(() => {
    const resolvedMembers: Member[] = members ?? [];
    const annotations: Record<string, string> = {};
    const labels: Record<string, string> = {};

    if (displayName) annotations[DISPLAY_NAME_ANNOTATION] = displayName;
    if (chargingTargetType) labels[CHARGING_TARGET_TYPE_LABEL] = chargingTargetType;
    if (chargingTarget) labels[CHARGING_TARGET_LABEL] = chargingTarget;
    if (supportServiceIds) annotations[SUPPORT_SERVICE_IDS_ANNOTATION] = supportServiceIds;
    if (supportLandscape) annotations[SUPPORT_LANDSCAPE_ANNOTATION] = supportLandscape;
    if (supportSecurityContacts) annotations[SUPPORT_SECURITY_CONTACTS_ANNOTATION] = supportSecurityContacts;
    if (supportOpsContacts) annotations[SUPPORT_OPS_CONTACTS_ANNOTATION] = supportOpsContacts;

    const resource = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: type === 'project' ? 'Project' : 'Workspace',
      metadata: {
        name: name || '<name>',
        ...(type === 'workspace' && projectNamespace ? { namespace: projectNamespace } : {}),
        ...(Object.keys(annotations).length ? { annotations } : {}),
        ...(Object.keys(labels).length ? { labels } : {}),
      },
      spec: {
        members: buildMembers(resolvedMembers),
      },
    };

    return stringify(resource);
  }, [
    name,
    displayName,
    chargingTarget,
    chargingTargetType,
    members,
    supportServiceIds,
    supportLandscape,
    supportSecurityContacts,
    supportOpsContacts,
    type,
    projectNamespace,
  ]);
}
