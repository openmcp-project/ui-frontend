import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const UpdateEsoMutation = gql`
  mutation UpdateExternalSecretsOperator($namespace: String, $name: String!, $object: ExternalSecretsOperatorInput!) {
    external_secrets_services_openmcp_cloud {
      v1alpha1 {
        updateExternalSecretsOperator(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useUpdateEso() {
  const [updateMutation, { loading, error }] = useMutation(UpdateEsoMutation);

  const update = useCallback(
    // TODO: replace `object: unknown` with the generated `ExternalSecretsOperatorInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
