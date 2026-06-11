import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const CreateFluxMutation = gql`
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
`;

export function useCreateFlux() {
  const [createMutation, { loading, error }] = useMutation(CreateFluxMutation, {
    refetchQueries: ['GetFlux'],
  });

  const create = useCallback(
    // TODO: replace `object: unknown` with the generated `FluxInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
