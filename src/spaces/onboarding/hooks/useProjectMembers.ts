import { useQuery } from '@apollo/client/react';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  CREATED_BY_ANNOTATION,
  DISPLAY_NAME_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';
import { Member, MemberRoles } from '../../../lib/api/types/shared/members';
import { extractSupportInfo } from '../../../lib/supportInfo';
import { graphql } from '../../../types/__generated__/graphql';

const GetProjectMembersQuery = graphql(`
  query GetProjectMembers($name: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Project(name: $name) {
          metadata {
            creationTimestamp
            annotations
            labels
          }
          spec {
            members {
              kind
              name
              namespace
              roles
            }
          }
        }
      }
    }
  }
`);

export function useProjectMembers(projectName: string) {
  const { data, loading } = useQuery(GetProjectMembersQuery, {
    variables: { name: projectName },
  });

  const project = data?.core_openmcp_cloud?.v1alpha1?.Project;
  const rawMembers = project?.spec?.members ?? [];
  const creationTimestamp: string | undefined = project?.metadata?.creationTimestamp ?? undefined;
  const annotations = (project?.metadata?.annotations as Record<string, string> | null | undefined) ?? {};
  const labels =
    ((project?.metadata as Record<string, unknown> | null | undefined)?.['labels'] as
      Record<string, string> | null | undefined) ?? {};
  const displayName: string | undefined = annotations[DISPLAY_NAME_ANNOTATION] || undefined;
  const createdBy: string | undefined = annotations[CREATED_BY_ANNOTATION] || undefined;
  const chargingTarget: string | undefined = labels[CHARGING_TARGET_LABEL] || undefined;
  const chargingTargetType: string | undefined = labels[CHARGING_TARGET_TYPE_LABEL] || undefined;
  const support = extractSupportInfo(annotations);

  const members: Member[] = rawMembers.flatMap((m) => {
    if (!m?.name || !m?.kind) return [];
    return [
      {
        kind: m.kind,
        name: m.name,
        namespace: m.namespace ?? undefined,
        roles: (m.roles?.filter((r): r is string => !!r) ?? []) as MemberRoles[],
      },
    ];
  });

  return {
    members,
    displayName,
    createdBy,
    chargingTarget,
    chargingTargetType,
    creationTimestamp,
    ...support,
    isLoading: loading,
  };
}
