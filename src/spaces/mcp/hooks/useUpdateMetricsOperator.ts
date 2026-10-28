import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateMetricsOperatorMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_METRICS_OPERATOR_QUERY } from '../../controlPlaneV2/components/Kpi/useMetricsOperatorQuery.ts';

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
  const [updateMutation, { loading, error }] = useMutation(UpdateMetricsOperatorMutation);

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({
        variables: variables as UpdateMetricsOperatorMutationVariables,
        refetchQueries: [
          { query: GET_METRICS_OPERATOR_QUERY, variables: { name: variables.name, namespace: variables.namespace } },
        ],
      });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
