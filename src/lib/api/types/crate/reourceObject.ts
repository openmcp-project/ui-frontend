import { Resource } from '../resource.ts';
import { ControlPlaneType } from './controlPlanes.ts';

export const ControlPlane = (
  projectName: string,
  workspaceName: string,
  resourceType: string = 'mcp',
  resourceName: string,
): Resource<ControlPlaneType> => {
  console.log('CP1');
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/project-${projectName}--ws-${workspaceName}/${resourceType}/${resourceName}`,
  };
};
