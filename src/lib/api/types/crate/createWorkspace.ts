import { Resource } from "../resource"
import { CHARGING_TARGET_LABEL, DISPLAY_NAME_ANNOTATION } from "../shared/keyNames";
import { Member } from "../shared/members";


export interface CreateWorkspaceType {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    annotations: {
      [annotation: string]: any;
    };
    labels: {
      [label: string]: any;
    };
  };
  spec: {
    members: Member[];
  };
}

export const CreateWorkspace = (
  projectName: string,
  namespace: string,
  optional?: {
    displayName?: string,
    chargingTarget?: string,
    members?: Member[],
  }
): CreateWorkspaceType => {
  return {
    apiVersion: "core.openmcp.cloud/v1alpha1",
    kind: "Workspace",
    metadata: {
      name: projectName,
      namespace: namespace,
      annotations: {
        [DISPLAY_NAME_ANNOTATION]: optional?.displayName ?? "",
      },
      labels: {
        [CHARGING_TARGET_LABEL]: optional?.chargingTarget ?? "",
      },
    },
    spec: {
      members: optional?.members ?? [],
    },
  };
};

export const CreateWorkspaceResource = (namespace: string): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/${namespace}/workspaces`,
    method: "POST",
    jq: undefined,
    body: undefined,
  }
};

