import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateMetricsOperatorMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_METRICS_OPERATOR_QUERY } from '../../controlPlaneV2/components/Kpi/useMetricsOperatorQuery.ts';

const CreateMetricsOperatorMutation = graphql(`
  mutation CreateMetricsOperator(
    $namespace: String
    $object: MetricsServicesOpenControlPlaneIoV1alpha1MetricsOperator_Input!
  ) {
    metrics_services_open_control_plane_io {
      v1alpha1 {
        createMetricsOperator(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useCreateMetricsOperator() {
  const [createMutation, { loading, error }] = useMutation(CreateMetricsOperatorMutation);

  const create = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      const { name, namespace, object } = variables;
      return createMutation({
        variables: { namespace, object } as CreateMetricsOperatorMutationVariables,
        refetchQueries: [{ query: GET_METRICS_OPERATOR_QUERY, variables: { name, namespace } }],
      });
    },
    [createMutation],
  );

  return { create, loading, error };
}
