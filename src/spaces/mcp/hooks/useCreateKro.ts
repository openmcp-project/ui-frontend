import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateKroMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_KRO_QUERY } from '../../controlPlaneV2/components/Kpi/useKroQuery.ts';

const CreateKroMutation = graphql(`
  mutation CreateKRO($namespace: String, $object: KroServicesOpenControlPlaneIoV1alpha1Kro_Input!) {
    kro_services_open_control_plane_io {
      v1alpha1 {
        createKro(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useCreateKro() {
  const [createMutation, { loading, error }] = useMutation(CreateKroMutation);

  const create = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      const { name, namespace, object } = variables;
      return createMutation({
        variables: { namespace, object } as CreateKroMutationVariables,
        refetchQueries: [{ query: GET_KRO_QUERY, variables: { name, namespace } }],
      });
    },
    [createMutation],
  );

  return { create, loading, error };
}
