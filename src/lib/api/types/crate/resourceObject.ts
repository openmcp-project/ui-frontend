import { Resource } from '../resource.ts';

export const ResourceObject = <T>(
  workspaceName: string,
  resourceType: string,
  resourceName: string,
  isV2: boolean = false,
): Resource<T> => {
  return {
    path: `/apis/core.openmcp.cloud/${isV2 ? 'v2alpha1' : 'v1alpha1'}/${workspaceName ? `namespaces/${workspaceName}/` : ''}${resourceType}/${resourceName}`,
  };
};
