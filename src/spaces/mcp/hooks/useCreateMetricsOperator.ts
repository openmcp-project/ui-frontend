import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateMetricsOperatorMutationVariables } from '../../../types/__generated__/graphql/graphql';

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
  const [createMutation, { loading, error }] = useMutation(CreateMetricsOperatorMutation, {
    refetchQueries: ['GetMetricsOperator'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables: variables as CreateMetricsOperatorMutationVariables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
