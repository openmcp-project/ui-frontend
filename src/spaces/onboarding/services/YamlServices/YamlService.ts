import { useQuery } from '@apollo/client';
import { graphql } from '@/types/__generated__/graphql';

const GetManagedControlPlaneYamlQuery = graphql(`
  query GetManagedControlPlaneYaml(
    $projectNamespace: String!
    $projectName: String!
  ) {
    core_openmcp_cloud {
      ManagedControlPlaneYaml(name: $projectName, namespace: $projectNamespace)
    }
  }
`);

export function useManagedControlPlaneYamlQuery(
  projectNamespace: string,
  projectName: string,
) {
  const query = useQuery(GetManagedControlPlaneYamlQuery, {
    variables: { projectNamespace, projectName },
  });

  const yaml = query.data?.core_openmcp_cloud?.ManagedControlPlaneYaml ?? '';

  return {
    ...query,
    data: yaml,
  };
}
