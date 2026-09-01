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
  const isV2 = V2_RESOURCE_TYPES.has(resourceType);
  const apiGroup = isV2 ? V2_API_GROUP : V1_API_GROUP;
  const apiVersion = isV2 ? 'v2alpha1' : 'v1alpha1';
  return {
    path: `/apis/${apiGroup}/${apiVersion}/${workspaceName ? `namespaces/${workspaceName}/` : ''}${resourceType}/${resourceName}`,
  };
};
