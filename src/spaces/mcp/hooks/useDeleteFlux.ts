import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const DeleteFluxMutation = gql`
  mutation DeleteFlux($name: String!, $namespace: String) {
    flux_services_openmcp_cloud {
      v1alpha1 {
        deleteFlux(name: $name, namespace: $namespace)
      }
    }
  }
`;

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
