import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql/index.ts';

const DeleteCrossplaneMutation = graphql(`
  mutation DeleteCrossplane($name: String!, $namespace: String) {
    crossplane_services_openmcp_cloud {
      v1alpha1 {
        deleteCrossplane(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useDeleteCrossplane() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteCrossplaneMutation, {
    refetchQueries: ['GetCrossplane'],
  });

  const deleteCrossplane = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({ variables });
    },
    [deleteMutation],
  );

  return { deleteCrossplane, loading, error };
}
