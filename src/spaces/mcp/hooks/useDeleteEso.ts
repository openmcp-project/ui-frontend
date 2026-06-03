import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const DeleteEsoMutation = gql`
  mutation DeleteExternalSecretsOperator($name: String!, $namespace: String) {
    external_secrets_services_openmcp_cloud {
      v1alpha1 {
        deleteExternalSecretsOperator(name: $name, namespace: $namespace)
      }
    }
  }
`;

export function useDeleteEso() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteEsoMutation, {
    refetchQueries: ['GetExternalSecretsOperator'],
  });

  const deleteEso = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({ variables });
    },
    [deleteMutation],
  );

  return { deleteEso, loading, error };
}
