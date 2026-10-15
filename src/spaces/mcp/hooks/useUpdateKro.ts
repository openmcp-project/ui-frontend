import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateKroMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_KRO_QUERY } from '../../controlPlaneV2/components/Kpi/useKroQuery.ts';

const UpdateKroMutation = graphql(`
  mutation UpdateKRO($namespace: String, $name: String!, $object: KroServicesOpenControlPlaneIoV1alpha1Kro_Input!) {
    kro_services_open_control_plane_io {
      v1alpha1 {
        updateKro(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useUpdateKro() {
  const [updateMutation, { loading, error }] = useMutation(UpdateKroMutation);

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({
        variables: variables as UpdateKroMutationVariables,
        refetchQueries: [{ query: GET_KRO_QUERY, variables: { name: variables.name, namespace: variables.namespace } }],
      });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
