import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';

const UpdateKroMutation = gql`
  mutation UpdateKRO($namespace: String, $name: String!, $object: KroServicesOpenControlPlaneIoV1alpha1Kro_Input!) {
    kro_services_open_control_plane_io {
      v1alpha1 {
        updateKRO(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useUpdateKro() {
  const [updateMutation, { loading, error }] = useMutation(UpdateKroMutation, {
    refetchQueries: ['GetKRO'],
  });

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
