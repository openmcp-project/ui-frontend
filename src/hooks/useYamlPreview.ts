import { useMemo } from 'react';
import { stringify } from 'yaml';
import { UseFormWatch } from 'react-hook-form';
import { CreateDialogProps } from '../components/Dialogs/CreateWorkspaceDialogContainer.tsx';
import {
  DISPLAY_NAME_ANNOTATION,
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
} from '../lib/api/types/shared/keyNames.ts';
import { Member } from '../lib/api/types/shared/members.ts';

type ResourceType = 'project' | 'workspace';

const buildMembers = (members: Member[]) =>
  members
    .filter((m) => !!m.name)
    .map(({ kind, name, roles, namespace }) => ({
      kind,
      name,
      roles,
      ...(kind === 'ServiceAccount' ? { namespace: namespace ?? 'default' } : {}),
    }));

export function useYamlPreview(watch: UseFormWatch<CreateDialogProps>, type: ResourceType, projectNamespace?: string) {
  const name = watch('name') ?? '';
  const displayName = watch('displayName') ?? '';
  const chargingTarget = watch('chargingTarget') ?? '';
  const chargingTargetType = watch('chargingTargetType') ?? '';
  const watchedMembers = watch('members');

  return useMemo(() => {
    const members: Member[] = watchedMembers ?? [];
    const annotations: Record<string, string> = {};
    const labels: Record<string, string> = {};

    if (displayName) annotations[DISPLAY_NAME_ANNOTATION] = displayName;
    if (chargingTargetType) labels[CHARGING_TARGET_TYPE_LABEL] = chargingTargetType;
    if (chargingTarget) labels[CHARGING_TARGET_LABEL] = chargingTarget;

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
        members: buildMembers(members),
      },
    };

    return stringify(resource);
  }, [name, displayName, chargingTarget, chargingTargetType, watchedMembers, type, projectNamespace]);
}
