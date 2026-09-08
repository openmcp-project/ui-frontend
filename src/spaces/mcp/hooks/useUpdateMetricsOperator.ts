import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateMetricsOperatorMutationVariables } from '../../../types/__generated__/graphql/graphql';

const UpdateMetricsOperatorMutation = graphql(`
  mutation UpdateMetricsOperator(
    $namespace: String
    $name: String!
    $object: MetricsServicesOpenControlPlaneIoV1alpha1MetricsOperator_Input!
  ) {
    metrics_services_open_control_plane_io {
      v1alpha1 {
        updateMetricsOperator(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useUpdateMetricsOperator() {
  const [updateMutation, { loading, error }] = useMutation(UpdateMetricsOperatorMutation, {
    refetchQueries: ['GetMetricsOperator'],
  });

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables: variables as UpdateMetricsOperatorMutationVariables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
