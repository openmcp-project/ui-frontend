import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateFluxMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_FLUX_QUERY } from '../../controlPlaneV2/components/Kpi/useFluxQuery.ts';

const CreateFluxMutation = graphql(`
  mutation CreateFlux($namespace: String, $object: FluxServicesOpenControlPlaneIoV1alpha1Flux_Input!) {
    flux_services_open_control_plane_io {
      v1alpha1 {
        createFlux(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useCreateFlux() {
  const [createMutation, { loading, error }] = useMutation(CreateFluxMutation);

  const create = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      const { name, namespace, object } = variables;
      return createMutation({
        variables: { namespace, object } as CreateFluxMutationVariables,
        refetchQueries: [{ query: GET_FLUX_QUERY, variables: { name, namespace } }],
      });
    },
    [createMutation],
  );

  return { create, loading, error };
}
