import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';

const DeleteMetricsOperatorMutation = graphql(`
  mutation DeleteMetricsOperator($name: String!, $namespace: String) {
    metrics_services_open_control_plane_io {
      v1alpha1 {
        deleteMetricsOperator(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useDeleteMetricsOperator() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteMetricsOperatorMutation, {
    refetchQueries: ['GetMetricsOperator'],
  });

  const deleteMetricsOperator = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({ variables });
    },
    [deleteMutation],
  );

  return { deleteMetricsOperator, loading, error };
}
