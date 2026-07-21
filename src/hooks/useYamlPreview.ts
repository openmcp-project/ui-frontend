import { useMemo } from 'react';
import { stringify } from 'yaml';
import {
  DISPLAY_NAME_ANNOTATION,
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
} from '../lib/api/types/shared/keyNames.ts';
import { Member } from '../lib/api/types/shared/members.ts';

type ResourceType = 'project' | 'workspace';

export interface YamlPreviewFields {
  name: string;
  displayName?: string;
  chargingTarget?: string;
  chargingTargetType?: string;
  members: Member[];
  extraAnnotations?: Record<string, string>;
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
  const { name, displayName, chargingTarget, chargingTargetType, members, extraAnnotations } = fields;

  return useMemo(() => {
    const resolvedMembers: Member[] = members ?? [];
    const annotations: Record<string, string> = {};
    const labels: Record<string, string> = {};

    if (displayName) annotations[DISPLAY_NAME_ANNOTATION] = displayName;
    if (chargingTargetType) labels[CHARGING_TARGET_TYPE_LABEL] = chargingTargetType;
    if (chargingTarget) labels[CHARGING_TARGET_LABEL] = chargingTarget;
    if (extraAnnotations) Object.assign(annotations, extraAnnotations);

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
  }, [name, displayName, chargingTarget, chargingTargetType, members, extraAnnotations, type, projectNamespace]);
}
