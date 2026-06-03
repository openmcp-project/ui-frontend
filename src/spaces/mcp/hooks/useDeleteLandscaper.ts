import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback } from 'react';

const DeleteLandscaperMutation = gql`
  mutation DeleteLandscaper($name: String!, $namespace: String) {
    landscaper_services_openmcp_cloud {
      v1alpha2 {
        deleteLandscaper(name: $name, namespace: $namespace)
      }
    }
  }
`;

export function useDeleteLandscaper() {
  const [deleteMutation, { loading, error }] = useMutation(DeleteLandscaperMutation, {
    refetchQueries: ['GetLandscaper'],
  });

  const deleteLandscaper = useCallback(
    async (variables: { namespace: string; name: string }) => {
      return deleteMutation({ variables });
    },
    [deleteMutation],
  );

  return { deleteLandscaper, loading, error };
}
