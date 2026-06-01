import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const CreateCrossplaneMutation = gql`
  mutation CreateCrossplane($namespace: String, $object: CrossplaneServicesOpenmcpCloudV1alpha1Crossplane_Input!) {
    crossplane_services_openmcp_cloud {
      v1alpha1 {
        createCrossplane(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useCreateCrossplane() {
  const [createMutation, { loading, error }] = useMutation(CreateCrossplaneMutation, {
    refetchQueries: ['GetCrossplane'],
  });

  const create = useCallback(
    // TODO: replace `object: unknown` with the generated `CrossplaneInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
