import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';

const DeleteKroMutation = gql`
  mutation DeleteKRO($name: String!, $namespace: String) {
    kro_services_open_control_plane_io {
      v1alpha1 {
        deleteKRO(name: $name, namespace: $namespace)
      }
    }
  }
`;

export function useDeleteKro() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteKroMutation, {
    refetchQueries: ['GetKRO'],
  });

  const deleteKro = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({ variables });
    },
    [deleteMutation],
  );

  return { deleteKro, loading, error };
}
