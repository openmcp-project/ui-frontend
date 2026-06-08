import { graphql } from '../../../types/__generated__/graphql/index.ts';

export const UpdateManagedControlPlaneV2Mutation = graphql(`
  mutation UpdateManagedControlPlaneV2(
    $name: String!
    $namespace: String
    $object: CoreOpenmcpCloudV2alpha1ManagedControlPlaneV2_Input!
    $dryRun: Boolean
  ) {
    core_openmcp_cloud {
      v2alpha1 {
        updateManagedControlPlaneV2(name: $name, namespace: $namespace, object: $object, dryRun: $dryRun) {
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
