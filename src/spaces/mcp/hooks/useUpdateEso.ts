import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateExternalSecretsOperatorMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_ESO_QUERY } from '../../controlPlaneV2/components/Kpi/useEsoQuery.ts';

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
  const [updateMutation, { loading, error }] = useMutation(UpdateEsoMutation);

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({
        variables: variables as UpdateExternalSecretsOperatorMutationVariables,
        refetchQueries: [{ query: GET_ESO_QUERY, variables: { name: variables.name, namespace: variables.namespace } }],
      });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
