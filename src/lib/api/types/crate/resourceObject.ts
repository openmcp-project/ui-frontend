import { Resource } from '../resource.ts';
import { ControlPlaneType } from './controlPlanes.ts';

export const ResourceObject = (
  workspaceName: string,
  resourceType: string,
  resourceName: string,
): Resource<ControlPlaneType> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/${workspaceName ? `namespaces/${workspaceName}/` : ''}${resourceType}/${resourceName}`,
  };
};
