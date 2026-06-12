import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateCrossplaneMutationVariables } from '../../../types/__generated__/graphql/graphql';

const CreateCrossplaneMutation = graphql(`
  mutation CreateCrossplane($namespace: String, $object: CrossplaneServicesOpenControlPlaneIoV1alpha1Crossplane_Input!) {
    crossplane_services_open_control_plane_io {
      v1alpha1 {
        createCrossplane(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useCreateCrossplane() {
  const [createMutation, { loading, error }] = useMutation(CreateCrossplaneMutation, {
    refetchQueries: ['GetCrossplane'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables: variables as CreateCrossplaneMutationVariables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
