import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateFluxMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_FLUX_QUERY } from '../../controlPlaneV2/components/Kpi/useFluxQuery.ts';

const UpdateFluxMutation = graphql(`
  mutation UpdateFlux($namespace: String, $name: String!, $object: FluxServicesOpenControlPlaneIoV1alpha1Flux_Input!) {
    flux_services_open_control_plane_io {
      v1alpha1 {
        updateFlux(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useUpdateFlux() {
  const [updateMutation, { loading, error }] = useMutation(UpdateFluxMutation);

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({
        variables: variables as UpdateFluxMutationVariables,
        refetchQueries: [
          { query: GET_FLUX_QUERY, variables: { name: variables.name, namespace: variables.namespace } },
        ],
      });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
