import { useMemo } from 'react';
import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { z } from 'zod';
import { Workspace, WorkspaceSchema } from '../../types/Workspace.ts';
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

const GetWorkspacesV2Query = graphql(`
  query GetWorkspacesV2($projectNamespace: String!) {
    core_openmcp_cloud {
      v2alpha1 {
        ManagedControlPlaneV2s(namespace: $projectNamespace) {
          items {
            apiVersion
            kind
            metadata {
              name
              namespace
              annotations
            }
          }
        }
      }
    }
  }
`);

export function useWorkspacesQuery(projectName?: string) {
  const projectNamespace = projectName ? `project-${projectName}` : undefined;
  const query = useQuery(GetWorkspacesQuery, {
    variables: { projectNamespace: projectNamespace ?? '' },
    skip: !projectNamespace,
    pollInterval: 10000,
    notifyOnNetworkStatusChange: true,
  });
  const query2 = useQuery(GetWorkspacesV2Query, {
    variables: { projectNamespace: projectNamespace ?? '' },
    skip: !projectNamespace,
    pollInterval: 10000,
    notifyOnNetworkStatusChange: true,
  });
  console.log(projectName);
  console.log(query.data?.core_openmcp_cloud?.v1alpha1?.Workspaces?.items);

  const workspaces = useMemo<Workspace[]>(() => {
    return (query.data?.core_openmcp_cloud?.v1alpha1?.Workspaces?.items ?? []).flatMap((item) => {
      const result = WorkspaceSchema.safeParse(item);
      if (!result.success) {
        console.warn('Invalid workspace data:', z.treeifyError(result.error), item);
        return [];
      }
      return [result.data];
    });
  }, [query.data?.core_openmcp_cloud?.v1alpha1?.Workspaces?.items]);

  const isPending = query.loading && query.networkStatus === NetworkStatus.loading;

  return {
    data: workspaces,
    error: query.error,
    isPending,
  };
}
