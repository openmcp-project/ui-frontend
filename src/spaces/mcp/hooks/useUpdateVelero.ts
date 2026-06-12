import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const UpdateVeleroMutation = gql`
  mutation UpdateVelero($namespace: String, $name: String!, $object: VeleroServicesOpenmcpCloudV1alpha1Velero_Input!) {
    velero_services_openmcp_cloud {
      v1alpha1 {
        updateVelero(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useUpdateVelero() {
  const [updateMutation, { loading, error }] = useMutation(UpdateVeleroMutation, {
    refetchQueries: ['GetVelero'],
  });

  const update = useCallback(
    // TODO: replace `object: unknown` with the generated `VeleroInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
