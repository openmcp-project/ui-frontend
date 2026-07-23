import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';

const DeleteOcmMutation = gql`
  mutation DeleteOCM($name: String!, $namespace: String) {
    ocm_services_open_control_plane_io {
      v1alpha1 {
        deleteOCM(name: $name, namespace: $namespace)
      }
    }
  }
`;

export function useDeleteOcm() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteOcmMutation, {
    refetchQueries: ['GetOCM'],
  });

  const deleteOcm = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({ variables });
    },
    [deleteMutation],
  );

  return { deleteOcm, loading, error };
}
