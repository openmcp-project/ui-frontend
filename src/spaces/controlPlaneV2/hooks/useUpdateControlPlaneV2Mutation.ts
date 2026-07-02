import { graphql } from '../../../types/__generated__/graphql';

export const UpdateManagedControlPlaneV2Mutation = graphql(`
  mutation UpdateManagedControlPlaneV2(
    $name: String!
    $namespace: String
    $object: CoreOpenControlPlaneIoV2alpha1ControlPlane_Input!
    $dryRun: Boolean
  ) {
    core_open_control_plane_io {
      v2alpha1 {
        updateControlPlane(name: $name, namespace: $namespace, object: $object, dryRun: $dryRun) {
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
