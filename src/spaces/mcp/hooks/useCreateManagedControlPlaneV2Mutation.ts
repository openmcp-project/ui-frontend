import { graphql } from '../../../types/__generated__/graphql/index.ts';

export const CreateManagedControlPlaneV2Mutation = graphql(`
  mutation CreateManagedControlPlaneV2(
    $namespace: String
    $object: CoreOpenmcpCloudV1alpha1ManagedControlPlane_Input!
    $dryRun: Boolean
  ) {
    core_openmcp_cloud {
      v1alpha1 {
        createManagedControlPlane(namespace: $namespace, object: $object, dryRun: $dryRun) {
          metadata {
            name
            namespace
          }
          status {
            status
          }
        }
      }
    }
  }
`);
