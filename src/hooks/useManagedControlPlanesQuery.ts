import { useApiResource } from '../lib/api/useApiResource.ts';
import { ControlPlaneType, ListControlPlanes } from '../lib/api/types/crate/controlPlanes.ts';
import { APIError } from '../lib/api/error.ts';

export interface ManagedControlPlanesQueryHookResult {
  managedControlPlanes: ControlPlaneType[] | undefined;
  error: APIError | undefined;
}
export function useManagedControlPlanesQuery(
  projectName: string,
  workspaceName: string,
): ManagedControlPlanesQueryHookResult {
  const { data: managedControlPlanes, error } = useApiResource(ListControlPlanes(projectName, workspaceName));

  return { managedControlPlanes, error };
}
