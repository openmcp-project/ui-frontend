import { useQuery } from '@apollo/client/react';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames';
import { Member, MemberRoles } from '../../../lib/api/types/shared/members';
import { graphql } from '../../../types/__generated__/graphql';

const GetProjectMembersQuery = graphql(`
  query GetProjectMembers($name: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Project(name: $name) {
          metadata {
            creationTimestamp
            annotations
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
  const displayName: string | undefined = annotations[DISPLAY_NAME_ANNOTATION] || undefined;

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

  return { members, displayName, creationTimestamp, isLoading: loading };
}
