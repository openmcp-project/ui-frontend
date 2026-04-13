import {
  CreateManagedControlPlaneType,
  CreateManagedControlPlaneV2Resource,
} from '../lib/api/types/crate/createManagedControlPlane.ts';
import { useApiResourceMutation } from '../lib/api/useApiResource.ts';

export function useCreateManagedControlPlane(projectName: string, workspaceName: string) {
  const { trigger } = useApiResourceMutation<CreateManagedControlPlaneType>(
    CreateManagedControlPlaneV2Resource(projectName, workspaceName),
  );

  const mutate = async (data: CreateManagedControlPlaneType) => {
    return trigger(data);
  };

  return { mutate };
}
