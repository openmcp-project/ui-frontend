import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Member, MemberRoles } from '../../../lib/api/types/shared/members';

const GetWorkspaceMembersQuery = gql`
  query GetWorkspaceMembers($namespace: String!, $name: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Workspace(namespace: $namespace, name: $name) {
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
`;

export function useWorkspaceMembers(workspaceNamespace: string, workspaceName: string, skip = false) {
  const { data, loading } = useQuery(GetWorkspaceMembersQuery, {
    variables: { namespace: workspaceNamespace, name: workspaceName },
    skip: skip || !workspaceNamespace || !workspaceName,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawMembers = (data as any)?.core_openmcp_cloud?.v1alpha1?.Workspace?.spec?.members ?? [];

  const members: Member[] = rawMembers.flatMap(
    (m: { kind?: string; name?: string; namespace?: string; roles?: string[] } | null) => {
      if (!m?.name || !m?.kind) return [];
      return [
        {
          kind: m.kind,
          name: m.name,
          namespace: m.namespace ?? undefined,
          roles: (m.roles?.filter((r): r is string => !!r) ?? []) as MemberRoles[],
        },
      ];
    },
  );

  return { members, isLoading: loading };
}
