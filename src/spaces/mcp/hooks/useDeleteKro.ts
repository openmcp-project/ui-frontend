import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';

const DeleteKroMutation = graphql(`
  mutation DeleteKRO($name: String!, $namespace: String) {
    kro_services_open_control_plane_io {
      v1alpha1 {
        deleteKro(name: $name, namespace: $namespace)
      }
    }
  }
`);

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
