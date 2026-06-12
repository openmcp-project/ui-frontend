import { graphql } from '../../../types/__generated__/graphql/index.ts';

export const DeleteManagedControlPlaneV2Mutation = graphql(`
  mutation DeleteManagedControlPlaneV2($name: String!, $namespace: String, $dryRun: Boolean) {
    core_open_control_plane_io {
      v2alpha1 {
        deleteControlPlane(name: $name, namespace: $namespace, dryRun: $dryRun)
      }
    }
  }
`);
