import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateFluxMutationVariables } from '../../../types/__generated__/graphql/graphql';

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
  const [createMutation, { loading, error }] = useMutation(CreateFluxMutation, {
    refetchQueries: ['GetFlux'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables: variables as CreateFluxMutationVariables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
