import { Resource } from '../resource.ts';

export const ResourceObject = (
  workspaceName: string,
  resourceType: string,
  resourceName: string,
): Resource<unknown> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/${workspaceName ? `namespaces/${workspaceName}/` : ''}${resourceType}/${resourceName}`,
  };
};
