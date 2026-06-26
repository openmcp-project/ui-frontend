import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateExternalSecretsOperatorMutationVariables } from '../../../types/__generated__/graphql/graphql';

const CreateEsoMutation = graphql(`
  mutation CreateExternalSecretsOperator(
    $namespace: String
    $object: ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperator_Input!
  ) {
    external_secrets_services_open_control_plane_io {
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
`);

export function useCreateEso() {
  const [createMutation, { loading, error }] = useMutation(CreateEsoMutation, {
    refetchQueries: ['GetExternalSecretsOperator'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables: variables as CreateExternalSecretsOperatorMutationVariables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
