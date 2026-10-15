import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateOcmMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_OCM_QUERY } from '../../controlPlaneV2/components/Kpi/useOcmQuery.ts';

const UpdateOcmMutation = graphql(`
  mutation UpdateOCM($namespace: String, $name: String!, $object: OcmServicesOpenControlPlaneIoV1alpha1OCM_Input!) {
    ocm_services_open_control_plane_io {
      v1alpha1 {
        updateOCM(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useUpdateOcm() {
  const [updateMutation, { loading, error }] = useMutation(UpdateOcmMutation);

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({
        variables: variables as UpdateOcmMutationVariables,
        refetchQueries: [{ query: GET_OCM_QUERY, variables: { name: variables.name, namespace: variables.namespace } }],
      });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
