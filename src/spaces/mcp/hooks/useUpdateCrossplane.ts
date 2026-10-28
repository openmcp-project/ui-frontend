import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateCrossplaneMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_CROSSPLANE_QUERY } from '../../controlPlaneV2/components/Kpi/useCrossplaneQuery.ts';

const UpdateCrossplaneMutation = graphql(`
  mutation UpdateCrossplane(
    $namespace: String
    $name: String!
    $object: CrossplaneServicesOpenControlPlaneIoV1alpha1Crossplane_Input!
  ) {
    crossplane_services_open_control_plane_io {
      v1alpha1 {
        updateCrossplane(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useUpdateCrossplane() {
  const [updateMutation, { loading, error }] = useMutation(UpdateCrossplaneMutation);

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({
        variables: variables as UpdateCrossplaneMutationVariables,
        refetchQueries: [
          { query: GET_CROSSPLANE_QUERY, variables: { name: variables.name, namespace: variables.namespace } },
        ],
      });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
