import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';

const CreateOcmMutation = gql`
  mutation CreateOCM($namespace: String, $object: OcmServicesOpenControlPlaneIoV1alpha1Ocm_Input!) {
    ocm_services_open_control_plane_io {
      v1alpha1 {
        createOCM(namespace: $namespace, object: $object) {
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
    refetchQueries: ['GetOCM'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
