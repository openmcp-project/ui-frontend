import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql/index.ts';

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
  const [deleteMutation, { loading, error }] = useMutation(DeleteFluxMutation, {
    refetchQueries: ['GetFlux'],
  });

  const deleteFlux = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({ variables });
    },
    [deleteMutation],
  );

  return { deleteFlux, loading, error };
}
