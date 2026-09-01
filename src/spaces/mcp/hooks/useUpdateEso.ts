import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateExternalSecretsOperatorMutationVariables } from '../../../types/__generated__/graphql/graphql';

const UpdateEsoMutation = graphql(`
  mutation UpdateExternalSecretsOperator(
    $namespace: String
    $name: String!
    $object: ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperator_Input!
  ) {
    external_secrets_services_open_control_plane_io {
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
`);

export function useUpdateEso() {
  const [updateMutation, { loading, error }] = useMutation(UpdateEsoMutation, {
    refetchQueries: ['GetExternalSecretsOperator'],
  });

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables: variables as UpdateExternalSecretsOperatorMutationVariables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
