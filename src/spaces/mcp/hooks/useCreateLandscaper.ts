import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { graphql } from '../../../types/__generated__/graphql';
import type { CreateLandscaperMutationVariables } from '../../../types/__generated__/graphql/graphql';
import { GET_LANDSCAPER_QUERY } from '../../controlPlaneV2/components/Kpi/useLandscaperQuery.ts';

const CreateLandscaperMutation = graphql(`
  mutation CreateLandscaper(
    $namespace: String
    $object: LandscaperServicesOpenControlPlaneIoV1alpha2Landscaper_Input!
  ) {
    landscaper_services_open_control_plane_io {
      v1alpha2 {
        createLandscaper(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useCreateLandscaper() {
  const [createMutation, { loading, error }] = useMutation(CreateLandscaperMutation);

  const create = useCallback(
    async (variables: { namespace: string; name: string; object: unknown }) => {
      const { name, namespace, object } = variables;
      return createMutation({
        variables: { namespace, object } as CreateLandscaperMutationVariables,
        refetchQueries: [{ query: GET_LANDSCAPER_QUERY, variables: { name, namespace } }],
      });
    },
    [createMutation],
  );

  return { create, loading, error };
}
