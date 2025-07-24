import { useQuery } from '@apollo/client';
import { graphql } from '../../../../types/__generated__/graphql';

const GetWorkspacesQuery = graphql(`
  query GetWorkspaces($projectNamespace: String!) {
    core_openmcp_cloud {
      Workspaces(namespace: $projectNamespace) {
        metadata {
          name
        }
      }
    }
  }
`);

export function useWorkspacesQuery(projectNamespace: string) {
  const query = useQuery(GetWorkspacesQuery, {
    variables: { projectNamespace },
  });

  const workspaceNames = (
    query.data?.core_openmcp_cloud?.Workspaces.map((workspace) => workspace.metadata?.name) ?? []
  ).filter((workspaceName) => workspaceName != null);

  return {
    ...query,
    data: workspaceNames,
  };
}
