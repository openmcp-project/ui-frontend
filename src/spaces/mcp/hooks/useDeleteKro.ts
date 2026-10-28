import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import { GET_KRO_QUERY } from '../../controlPlaneV2/components/Kpi/useKroQuery.ts';

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
  const [deleteMutation, { loading, error }] = useMutation(DeleteKroMutation);

  const deleteKro = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({
        variables,
        refetchQueries: [{ query: GET_KRO_QUERY, variables: { name: variables.name, namespace: variables.namespace } }],
      });
    },
    [deleteMutation],
  );

  return { deleteKro, loading, error };
}
