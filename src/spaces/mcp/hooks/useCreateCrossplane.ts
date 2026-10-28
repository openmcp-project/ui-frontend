import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateCrossplaneMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_CROSSPLANE_QUERY } from '../../controlPlaneV2/components/Kpi/useCrossplaneQuery.ts';

const CreateCrossplaneMutation = graphql(`
  mutation CreateCrossplane(
    $namespace: String
    $object: CrossplaneServicesOpenControlPlaneIoV1alpha1Crossplane_Input!
  ) {
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
  const [createMutation, { loading, error }] = useMutation(CreateCrossplaneMutation);

  // `name` is only used to scope the KPI-query refetch below — it isn't part of the mutation's
  // own variables — so it's pulled out before the `as CreateCrossplaneMutationVariables` cast.
  const create = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      const { name, namespace, object } = variables;
      return createMutation({
        variables: { namespace, object } as CreateCrossplaneMutationVariables,
        refetchQueries: [{ query: GET_CROSSPLANE_QUERY, variables: { name, namespace } }],
      });
    },
    [createMutation],
  );

  return { create, loading, error };
}
