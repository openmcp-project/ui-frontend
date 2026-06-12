import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const UpdateOcmMutation = gql`
  mutation UpdateOcm($namespace: String, $name: String!, $object: OcmServicesOpenmcpCloudV1alpha1Ocm_Input!) {
    ocm_services_openmcp_cloud {
      v1alpha1 {
        updateOcm(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useUpdateOcm() {
  const [updateMutation, { loading, error }] = useMutation(UpdateOcmMutation, {
    refetchQueries: ['GetOcm'],
  });

  const update = useCallback(
    // TODO: replace `object: unknown` with the generated `OcmInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
