// CODEGEN REQUIRED: this file adds a field (`metadata.uid`, for Apollo cache normalization) to
// an existing operation (`UpdateManagedControlPlane`). It will not type-check until
// `npm run generate-graphql-types -- <token>` is run.
import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { graphql } from '../types/__generated__/graphql';
import type { CoreOpenmcpCloudV1alpha1ManagedControlPlane_Input } from '../types/__generated__/graphql/graphql';
import type { CreateManagedControlPlaneType } from '../lib/api/types/crate/createManagedControlPlane';

const UpdateManagedControlPlaneMutation = graphql(`
  mutation UpdateManagedControlPlane(
    $name: String!
    $namespace: String
    $object: CoreOpenmcpCloudV1alpha1ManagedControlPlane_Input!
  ) {
    core_openmcp_cloud {
      v1alpha1 {
        updateManagedControlPlane(name: $name, namespace: $namespace, object: $object) {
          metadata {
            uid
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useUpdateManagedControlPlane(projectName: string, workspaceName: string, mcpName: string) {
  const [updateMutation] = useMutation(UpdateManagedControlPlaneMutation, {
    refetchQueries: ['GetMCPsList'],
  });

  const mutate = useCallback(
    async (data: CreateManagedControlPlaneType) => {
      return updateMutation({
        variables: {
          name: mcpName,
          namespace: `${projectName}--ws-${workspaceName}`,
          object: data as unknown as CoreOpenmcpCloudV1alpha1ManagedControlPlane_Input,
        },
      });
    },
    [updateMutation, projectName, workspaceName, mcpName],
  );

  return { mutate };
}
