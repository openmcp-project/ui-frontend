import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const UpdateLandscaperMutation = gql`
  mutation UpdateLandscaper(
    $namespace: String
    $name: String!
    $object: LandscaperInput!
  ) {
    landscaper_services_openmcp_cloud {
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
`;

export function useUpdateLandscaper() {
  const [updateMutation, { loading, error }] = useMutation(UpdateLandscaperMutation, {
    refetchQueries: ['GetLandscaper'],
  });

  const update = useCallback(
    // TODO: replace `object: unknown` with the generated `LandscaperInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
