import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateExternalSecretsOperatorMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_ESO_QUERY } from '../../controlPlaneV2/components/Kpi/useEsoQuery.ts';

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
  const [createMutation, { loading, error }] = useMutation(CreateEsoMutation);

  const create = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      const { name, namespace, object } = variables;
      return createMutation({
        variables: { namespace, object } as CreateExternalSecretsOperatorMutationVariables,
        refetchQueries: [{ query: GET_ESO_QUERY, variables: { name, namespace } }],
      });
    },
    [createMutation],
  );

  return { create, loading, error };
}
