import { useMemo, useEffect } from 'react';
import { NetworkStatus } from '@apollo/client';
import { useQuery, useSubscription } from '@apollo/client/react';
import { z } from 'zod';
import { Workspace, WorkspaceSchema } from '../../types/Workspace.ts';
import { graphql } from '../../../../types/__generated__/graphql';

const GetWorkspacesQuery = graphql(`
  query GetWorkspaces($projectNamespace: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Workspaces(namespace: $projectNamespace) {
          resourceVersion
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

const WorkspacesSubscription = graphql(`
  subscription WorkspacesSubscription($namespace: String!) {
    core_openmcp_cloud_v1alpha1_workspaces(namespace: $namespace) {
      type
    }
  }
`);

export function useWorkspacesQuery(projectName?: string) {
  const projectNamespace = projectName ? `project-${projectName}` : undefined;
  const query = useQuery(GetWorkspacesQuery, {
    variables: { projectNamespace: projectNamespace ?? '' },
    skip: !projectNamespace,
    notifyOnNetworkStatusChange: true,
  });

  // Subscribe to workspace changes - use events as signals to refetch
  const { data: subscriptionData } = useSubscription(WorkspacesSubscription, {
    variables: { namespace: projectNamespace ?? '' },
    skip: !projectNamespace,
  });

  const { refetch } = query;

  // Refetch when subscription receives any event
  useEffect(() => {
    if (subscriptionData?.core_openmcp_cloud_v1alpha1_workspaces) {
      refetch();
    }
  }, [subscriptionData, refetch]);

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
