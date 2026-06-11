import { graphql } from '../../../types/__generated__/graphql/index.ts';

export const DeleteManagedControlPlaneV2Mutation = graphql(`
  mutation DeleteManagedControlPlaneV2($name: String!, $namespace: String, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        deleteManagedControlPlane(name: $name, namespace: $namespace, dryRun: $dryRun)
      }
    }
  }
`);
