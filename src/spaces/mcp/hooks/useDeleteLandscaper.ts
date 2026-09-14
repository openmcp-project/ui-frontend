import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql/index.ts';
import { GET_LANDSCAPER_QUERY } from '../../controlPlaneV2/components/Kpi/useLandscaperQuery.ts';

const DeleteLandscaperMutation = graphql(`
  mutation DeleteLandscaper($name: String!, $namespace: String) {
    landscaper_services_open_control_plane_io {
      v1alpha2 {
        deleteLandscaper(name: $name, namespace: $namespace)
      }
    }
  }
`);

export function useDeleteLandscaper() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteLandscaperMutation);

  const deleteLandscaper = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({
        variables,
        refetchQueries: [
          { query: GET_LANDSCAPER_QUERY, variables: { name: variables.name, namespace: variables.namespace } },
        ],
      });
    },
    [deleteMutation],
  );

  return { deleteLandscaper, loading, error };
}
