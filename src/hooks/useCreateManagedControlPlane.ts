import { useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { graphql } from '../types/__generated__/graphql';
import type { CoreOpenmcpCloudV1alpha1ManagedControlPlane_Input } from '../types/__generated__/graphql/graphql';
import type { CreateManagedControlPlaneType } from '../lib/api/types/crate/createManagedControlPlane';

const CreateManagedControlPlaneMutation = graphql(`
  mutation CreateManagedControlPlane($namespace: String, $object: CoreOpenmcpCloudV1alpha1ManagedControlPlane_Input!) {
    core_openmcp_cloud {
      v1alpha1 {
        createManagedControlPlane(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`);

export function useCreateManagedControlPlane(projectName: string, workspaceName: string) {
  const [createMutation] = useMutation(CreateManagedControlPlaneMutation, {
    refetchQueries: ['GetMCPsList'],
  });

  const mutate = useCallback(
    async (data: CreateManagedControlPlaneType) => {
      return createMutation({
        variables: {
          namespace: `${projectName}--ws-${workspaceName}`,
          object: data as unknown as CoreOpenmcpCloudV1alpha1ManagedControlPlane_Input,
        },
      });
    },
    [createMutation, projectName, workspaceName],
  );

  return { mutate };
}
