import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateLandscaperMutationVariables } from '../../../types/__generated__/graphql/graphql';

const CreateLandscaperMutation = graphql(`
  mutation CreateLandscaper($namespace: String, $object: LandscaperServicesOpenControlPlaneIoV1alpha2Landscaper_Input!) {
    landscaper_services_open_control_plane_io {
      v1alpha2 {
        createLandscaper(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useCreateLandscaper() {
  const [createMutation, { loading, error }] = useMutation(CreateLandscaperMutation, {
    refetchQueries: ['GetLandscaper'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables: variables as CreateLandscaperMutationVariables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
