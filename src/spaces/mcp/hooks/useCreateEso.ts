import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const CreateEsoMutation = gql`
  mutation CreateExternalSecretsOperator($namespace: String, $object: ExternalSecretsOperatorInput!) {
    external_secrets_services_openmcp_cloud {
      v1alpha1 {
        createExternalSecretsOperator(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;

export function useCreateEso() {
  const [createMutation, { loading, error }] = useMutation(CreateEsoMutation, {
    refetchQueries: ['GetExternalSecretsOperator'],
  });

  const create = useCallback(
    // TODO: replace `object: unknown` with the generated `ExternalSecretsOperatorInput` type once GraphQL codegen is restored.
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
