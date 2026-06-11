import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const UpdateFluxMutation = gql`
  mutation UpdateFlux($namespace: String, $name: String!, $object: FluxServicesOpenmcpCloudV1alpha1Flux_Input!) {
    flux_services_openmcp_cloud {
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
`;

export function useUpdateFlux() {
  const [updateMutation, { loading, error }] = useMutation(UpdateFluxMutation, {
    refetchQueries: ['GetFlux'],
  });

  const update = useCallback(
    // TODO: replace `object: unknown` with the generated `FluxInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
