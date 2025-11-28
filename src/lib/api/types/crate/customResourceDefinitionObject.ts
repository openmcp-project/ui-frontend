import { Resource } from '../resource';
import { CustomResourceDefinition } from '../../../../types/customResourceDefinition';

const crdNameMapping = {
  projects: 'projects.core.openmcp.cloud',
  workspaces: 'workspaces.core.openmcp.cloud',
  managedcontrolplanes: 'managedcontrolplanes.core.openmcp.cloud',
};

export const CustomResourceDefinitionObject = (
  resourceType: keyof typeof crdNameMapping,
): Resource<CustomResourceDefinition> => {
  const crdName = crdNameMapping[resourceType];
  return {
    path: `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${crdName}`,
  };
};
