import { Resource } from '../resource';

export const DeleteProjectResource = (projectName: string): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/projects/${projectName}`,
    method: 'DELETE',
    jq: undefined,
    body: undefined,
  };
};
