import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const CreateLandscaperMutation = gql`
  mutation CreateLandscaper(
    $namespace: String
    $object: LandscaperServicesOpenControlPlaneIoV1alpha2Landscaper_Input!
  ) {
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
`;

export function useCreateLandscaper() {
  const [createMutation, { loading, error }] = useMutation(CreateLandscaperMutation, {
    refetchQueries: ['GetLandscaper'],
  });

  const create = useCallback(
    // TODO: replace `object: unknown` with the generated `LandscaperInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
