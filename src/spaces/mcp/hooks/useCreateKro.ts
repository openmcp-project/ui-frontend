import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateKroMutationVariables } from '../../../types/__generated__/graphql/graphql';

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
  const [createMutation, { loading, error }] = useMutation(CreateKroMutation, {
    refetchQueries: ['GetKRO'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables: variables as CreateKroMutationVariables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
