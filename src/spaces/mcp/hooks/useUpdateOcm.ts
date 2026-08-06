import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { UpdateOcmMutationVariables } from '../../../types/__generated__/graphql/graphql';

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
  const [updateMutation, { loading, error }] = useMutation(UpdateOcmMutation, {
    refetchQueries: ['GetOCM'],
  });

  const update = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      return updateMutation({ variables: variables as UpdateOcmMutationVariables });
    },
    [updateMutation],
  );

  return { update, loading, error };
}
