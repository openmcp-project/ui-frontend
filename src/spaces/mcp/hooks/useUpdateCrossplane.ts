import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const UpdateCrossplaneMutation = gql`
  mutation UpdateCrossplane($namespace: String, $name: String!, $object: CrossplaneInput!) {
    crossplane_services_openmcp_cloud {
      v1alpha1 {
        updateCrossplane(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useUpdateCrossplane() {
  const [updateMutation, { loading, error }] = useMutation(UpdateCrossplaneMutation);

  const updateCrossplane = useCallback(
    // TODO: replace `object: unknown` with the generated `CrossplaneInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables });
    },
    [updateMutation],
  );

  return { updateCrossplane, loading, error };
}
