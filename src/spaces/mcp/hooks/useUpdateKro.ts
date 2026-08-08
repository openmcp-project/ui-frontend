import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateKroMutationVariables } from '../../../types/__generated__/graphql/graphql';

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
  const [updateMutation, { loading, error }] = useMutation(UpdateKroMutation, {
    refetchQueries: ['GetKRO'],
  });

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables: variables as UpdateKroMutationVariables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
