import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateOcmMutationVariables } from '../../../types/__generated__/graphql/graphql';

const CreateOcmMutation = graphql(`
  mutation CreateOCM($namespace: String, $object: OcmServicesOpenControlPlaneIoV1alpha1OCM_Input!) {
    ocm_services_open_control_plane_io {
      v1alpha1 {
        createOCM(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useCreateOcm() {
  const [createMutation, { loading, error }] = useMutation(CreateOcmMutation, {
    refetchQueries: ['GetOCM'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables: variables as CreateOcmMutationVariables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
