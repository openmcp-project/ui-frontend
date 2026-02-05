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
