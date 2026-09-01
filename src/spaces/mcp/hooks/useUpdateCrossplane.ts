import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateCrossplaneMutationVariables } from '../../../types/__generated__/graphql/graphql';

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
  const [updateMutation, { loading, error }] = useMutation(UpdateCrossplaneMutation, {
    refetchQueries: ['GetCrossplane'],
  });

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables: variables as UpdateCrossplaneMutationVariables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
