import {
  UpdateManagedControlPlaneResource,
  CreateManagedControlPlaneType,
} from '../lib/api/types/crate/createManagedControlPlane.ts';
import { useApiResourceMutation } from '../lib/api/useApiResource.ts';

export function useUpdateManagedControlPlane(projectName: string, workspaceName: string, mcpName: string) {
  const { trigger } = useApiResourceMutation<CreateManagedControlPlaneType>(
    UpdateManagedControlPlaneResource(projectName, workspaceName, mcpName),
    undefined,
    true,
  );

  const mutate = async (data: CreateManagedControlPlaneType) => {
    return trigger(data);
  };

  return { mutate };
}
