import { graphql } from '../../../types/__generated__/graphql/index.ts';

export const CreateManagedControlPlaneV2Mutation = graphql(`
  mutation CreateManagedControlPlaneV2(
    $namespace: String
    $object: CoreOpenControlPlaneIoV2alpha1ControlPlane_Input!
    $dryRun: Boolean
  ) {
    core_open_control_plane_io {
      v2alpha1 {
        createControlPlane(namespace: $namespace, object: $object, dryRun: $dryRun) {
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
