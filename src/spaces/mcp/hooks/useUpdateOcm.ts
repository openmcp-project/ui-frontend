import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';

const UpdateOcmMutation = gql`
  mutation UpdateOCM($namespace: String, $name: String!, $object: OcmServicesOpenControlPlaneIoV1alpha1Ocm_Input!) {
    ocm_services_open_control_plane_io {
      v1alpha1 {
        updateOCM(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useUpdateOcm() {
  const [updateMutation, { loading, error }] = useMutation(UpdateOcmMutation, {
    refetchQueries: ['GetOCM'],
  });

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
