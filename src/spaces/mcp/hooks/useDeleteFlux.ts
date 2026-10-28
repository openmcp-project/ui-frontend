import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql/index.ts';
import { GET_FLUX_QUERY } from '../../controlPlaneV2/components/Kpi/useFluxQuery.ts';

const DeleteFluxMutation = graphql(`
  mutation DeleteFlux($name: String!, $namespace: String) {
    flux_services_open_control_plane_io {
      v1alpha1 {
        deleteFlux(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useDeleteFlux() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteFluxMutation);

  const deleteFlux = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({
        variables,
        refetchQueries: [
          { query: GET_FLUX_QUERY, variables: { name: variables.name, namespace: variables.namespace } },
        ],
      });
    },
    [deleteMutation],
  );

  return { deleteFlux, loading, error };
}
