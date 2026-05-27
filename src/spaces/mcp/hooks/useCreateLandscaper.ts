import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const CreateLandscaperMutation = gql`
  mutation CreateLandscaper($namespace: String, $object: LandscaperInput!) {
    landscaper_services_openmcp_cloud {
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
  const [createMutation, { loading, error }] = useMutation(CreateLandscaperMutation);

  const create = useCallback(
    // TODO: replace `object: unknown` with the generated `LandscaperInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
