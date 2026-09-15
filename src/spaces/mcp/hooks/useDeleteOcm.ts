import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import { GET_OCM_QUERY } from '../../controlPlaneV2/components/Kpi/useOcmQuery.ts';

const DeleteOcmMutation = graphql(`
  mutation DeleteOCM($name: String!, $namespace: String) {
    ocm_services_open_control_plane_io {
      v1alpha1 {
        deleteOCM(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useDeleteOcm() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteOcmMutation);

  const deleteOcm = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({
        variables,
        refetchQueries: [{ query: GET_OCM_QUERY, variables: { name: variables.name, namespace: variables.namespace } }],
      });
    },
    [deleteMutation],
  );

  return { deleteOcm, loading, error };
}
