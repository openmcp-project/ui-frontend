import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const CreateOcmMutation = gql`
  mutation CreateOcm($namespace: String, $object: OcmServicesOpenmcpCloudV1alpha1Ocm_Input!) {
    ocm_services_openmcp_cloud {
      v1alpha1 {
        createOcm(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useCreateOcm() {
  const [createMutation, { loading, error }] = useMutation(CreateOcmMutation, {
    refetchQueries: ['GetOcm'],
  });

  const create = useCallback(
    // TODO: replace `object: unknown` with the generated `OcmInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
