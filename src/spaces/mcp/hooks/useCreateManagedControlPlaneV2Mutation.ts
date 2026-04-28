import { graphql } from '../../../types/__generated__/graphql/index.ts';

export const CreateManagedControlPlaneV2Mutation = graphql(`
  mutation CreateManagedControlPlaneV2($namespace: String, $object: ManagedControlPlaneV2Input!, $dryRun: Boolean) {
    core_openmcp_cloud {
      v2alpha1 {
        createManagedControlPlaneV2(namespace: $namespace, object: $object, dryRun: $dryRun) {
          metadata {
            name
            namespace
          }
          status {
            phase
          }
        }
      }
    }
  }
`);
