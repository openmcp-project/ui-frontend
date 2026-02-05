import { useQuery } from '@apollo/client/react';
import { ListWorkspacesType } from '../../../../lib/api/types/crate/listWorkspaces.ts';
import { Member } from '../../../../lib/api/types/shared/members.ts';
import { graphql } from '../../../../types/__generated__/graphql';

const GetWorkspacesQuery = graphql(`
  query GetWorkspaces($projectNamespace: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Workspaces(namespace: $projectNamespace) {
          items {
            apiVersion
            kind
            metadata {
              name
              namespace
              annotations
            }
            spec {
              members {
                kind
                name
                roles
                namespace
              }
            }
            status {
              namespace
            }
          }
        }
      }
    }
  }
`);

export function  useWorkspacesQuery(projectNamespace?: string) {
  const query = useQuery(GetWorkspacesQuery, {
    variables: { projectNamespace: projectNamespace ?? '' },
    skip: !projectNamespace,
  });

  const workspaces: ListWorkspacesType[] = (query.data?.core_openmcp_cloud?.v1alpha1?.Workspaces?.items ?? []).flatMap(
    (workspace) => {
      if (!workspace?.metadata?.name || !workspace.metadata.namespace) {
        return [];
      }

      const members: Member[] = (workspace.spec?.members ?? [])
        .filter((member): member is NonNullable<typeof member> => !!member)
        .map((member) => ({
          kind: member.kind ?? '',
          name: member.name ?? '',
          roles: (member.roles ?? []).filter((role): role is string => !!role),
          namespace: member.namespace ?? undefined,
        }))
        .filter((member) => member.kind.length > 0 && member.name.length > 0);

      const result: ListWorkspacesType = {
        metadata: {
          name: workspace.metadata.name,
          namespace: workspace.metadata.namespace,
          annotations: workspace.metadata.annotations ?? {},
        },
        spec: {
          members,
        },
      };

      if (workspace.status?.namespace) {
        result.status = {
          namespace: workspace.status.namespace,
        };
      }

      return [result];
    },
  );

  return {
    ...query,
    data: workspaces,
  };
}
