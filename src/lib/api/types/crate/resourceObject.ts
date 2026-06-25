import { Resource } from '../resource.ts';

export type ResourceType = 'projects' | 'workspaces' | 'managedcontrolplanes' | 'controlplanes';

const V1_API_GROUP = 'core.openmcp.cloud';
const V2_API_GROUP = 'core.open-control-plane.io';

const V2_RESOURCE_TYPES: ReadonlySet<ResourceType> = new Set(['controlplanes']);

export const ResourceObject = <T>(
  workspaceName: string,
  resourceType: ResourceType,
  resourceName: string,
): Resource<T> => {
  const isNewControlPlane = V2_RESOURCE_TYPES.has(resourceType);
  const apiGroup = isNewControlPlane ? V2_API_GROUP : V1_API_GROUP;
  const apiVersion = isNewControlPlane ? 'v2alpha1' : 'v1alpha1';
  return {
    path: `/apis/${apiGroup}/${apiVersion}/${workspaceName ? `namespaces/${workspaceName}/` : ''}${resourceType}/${resourceName}`,
  };
};
