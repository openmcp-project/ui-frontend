import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql/index.ts';

const DeleteEsoMutation = graphql(`
  mutation DeleteExternalSecretsOperator($name: String!, $namespace: String) {
    external_secrets_services_open_control_plane_io {
      v1alpha1 {
        deleteExternalSecretsOperator(name: $name, namespace: $namespace)
      }
    }
  }
`);

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
