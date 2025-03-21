import { Resource } from '../resource';

export interface DeleteWorkspaceType {
  name: string;
  namespace: string;
}

export const DeleteWorkspaceResource = (
  namespace: string,
  workspaceName: string,
): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/${namespace}/workspaces/${workspaceName}`,
    method: 'DELETE',
    jq: undefined,
    body: undefined,
  };
};
