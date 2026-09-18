import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateOcmMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_OCM_QUERY } from '../../controlPlaneV2/components/Kpi/useOcmQuery.ts';

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
  const [createMutation, { loading, error }] = useMutation(CreateOcmMutation);

  const create = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      const { name, namespace, object } = variables;
      return createMutation({
        variables: { namespace, object } as CreateOcmMutationVariables,
        refetchQueries: [{ query: GET_OCM_QUERY, variables: { name, namespace } }],
      });
    },
    [createMutation],
  );

  return { create, loading, error };
}
