import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql/index.ts';
import { GET_CROSSPLANE_QUERY } from '../../controlPlaneV2/components/Kpi/useCrossplaneQuery.ts';

const DeleteCrossplaneMutation = graphql(`
  mutation DeleteCrossplane($name: String!, $namespace: String) {
    crossplane_services_open_control_plane_io {
      v1alpha1 {
        deleteCrossplane(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useDeleteCrossplane() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteCrossplaneMutation);

  const deleteCrossplane = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({
        variables,
        refetchQueries: [
          { query: GET_CROSSPLANE_QUERY, variables: { name: variables.name, namespace: variables.namespace } },
        ],
      });
    },
    [deleteMutation],
  );

  return { deleteCrossplane, loading, error };
}
