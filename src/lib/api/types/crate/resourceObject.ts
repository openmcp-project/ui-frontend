import { Resource } from '../resource.ts';

export type ResourceType = 'projects' | 'workspaces' | 'managedcontrolplanes' | 'managedcontrolplanev2s';

const V2_RESOURCE_TYPES: ReadonlySet<ResourceType> = new Set(['managedcontrolplanev2s']);

export const ResourceObject = <T>(
  workspaceName: string,
  resourceType: ResourceType,
  resourceName: string,
): Resource<T> => {
  const apiVersion = V2_RESOURCE_TYPES.has(resourceType) ? 'v2alpha1' : 'v1alpha1';
  return {
    path: `/apis/core.openmcp.cloud/${apiVersion}/${workspaceName ? `namespaces/${workspaceName}/` : ''}${resourceType}/${resourceName}`,
  };
};
