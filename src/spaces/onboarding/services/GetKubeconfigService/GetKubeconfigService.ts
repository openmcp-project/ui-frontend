import { graphql } from '../../../../types/__generated__/graphql';

export const GET_KUBECONFIG_QUERY = graphql(`
  query GetKubeconfig($kubeConfigName: String!, $namespaceName: String) {
    v1 {
      Secret(name: $kubeConfigName, namespace: $namespaceName) {
        data
      }
    }
  }
`);
