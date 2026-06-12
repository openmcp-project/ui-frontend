import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const CreateVeleroMutation = gql`
  mutation CreateVelero($namespace: String, $object: VeleroServicesOpenmcpCloudV1alpha1Velero_Input!) {
    velero_services_openmcp_cloud {
      v1alpha1 {
        createVelero(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useCreateVelero() {
  const [createMutation, { loading, error }] = useMutation(CreateVeleroMutation, {
    refetchQueries: ['GetVelero'],
  });

  const create = useCallback(
    // TODO: replace `object: unknown` with the generated `VeleroInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
