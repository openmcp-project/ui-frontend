import {
  CreateManagedControlPlaneResource,
  CreateManagedControlPlaneType,
} from '../lib/api/types/crate/createManagedControlPlane.ts';
import { useApiResourceMutation } from '../lib/api/useApiResource.ts';

export function useCreateManagedControlPlane(projectName: string, workspaceName: string) {
  const { trigger } = useApiResourceMutation<CreateManagedControlPlaneType>(
    CreateManagedControlPlaneResource(projectName, workspaceName),
  );

  const mutate = async (data: CreateManagedControlPlaneType) => {
    return trigger(data);
  };

  return { mutate };
}
