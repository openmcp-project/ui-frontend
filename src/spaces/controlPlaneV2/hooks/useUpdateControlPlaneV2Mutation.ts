// CODEGEN REQUIRED: this file adds a field (`metadata.uid`, for Apollo cache normalization) to
// an existing operation (`UpdateManagedControlPlaneV2`). It will not type-check until
// `npm run generate-graphql-types -- <token>` is run.
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
