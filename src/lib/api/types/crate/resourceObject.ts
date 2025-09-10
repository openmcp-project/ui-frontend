import { Resource } from '../resource.ts';

export const ResourceObject = <T>(workspaceName: string, resourceType: string, resourceName: string): Resource<T> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/${workspaceName ? `namespaces/${workspaceName}/` : ''}${resourceType}/${resourceName}`,
  };
};
