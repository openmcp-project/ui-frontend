import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateLandscaperMutationVariables } from '../../../types/__generated__/graphql/graphql';

const UpdateLandscaperMutation = graphql(`
  mutation UpdateLandscaper(
    $namespace: String
    $name: String!
    $object: LandscaperServicesOpenControlPlaneIoV1alpha2Landscaper_Input!
  ) {
    landscaper_services_open_control_plane_io {
      v1alpha2 {
        updateLandscaper(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useUpdateLandscaper() {
  const [updateMutation, { loading, error }] = useMutation(UpdateLandscaperMutation, {
    refetchQueries: ['GetLandscaper'],
  });

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables: variables as UpdateLandscaperMutationVariables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
