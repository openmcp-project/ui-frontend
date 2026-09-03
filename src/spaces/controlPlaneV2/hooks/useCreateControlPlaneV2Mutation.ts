// CODEGEN REQUIRED: this file adds a field (`metadata.uid`, for Apollo cache normalization) to
// an existing operation (`CreateManagedControlPlaneV2`). It will not type-check until
// `npm run generate-graphql-types -- <token>` is run.
import { graphql } from '../../../types/__generated__/graphql';

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
            uid
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
