import { Resource } from '../resource';
import { Member } from '../shared/members';

export interface ListWorkspacesType {
  metadata: {
    name: string;
    namespace: string;
    annotations: { [key: string]: string };
  };
  spec: {
    members: Member[];
  };
  status?: {
    namespace: string;
  };
}

export function isWorkspaceReady(workspace: ListWorkspacesType): boolean {
  return workspace.status != null && workspace.status.namespace != null;
}

export const ListWorkspaces = (
  projectName: string,
): Resource<ListWorkspacesType[]> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/project-${projectName}/workspaces`,
    jq: '[.items[] | {metadata: .metadata | {name, namespace, annotations, deletionTimestamp}, status: .status, spec: .spec | {members: [.members[] | {name, roles}]}}]',
  };
};
