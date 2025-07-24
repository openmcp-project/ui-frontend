import { Resource } from '../resource';

export interface DeleteMCPType {
  name: string;
  namespace: string;
}

export const PatchMCPResourceForDeletionBody = {
  metadata: {
    annotations: {
      'confirmation.openmcp.cloud/deletion': 'true',
    },
  },
};

export const PatchMCPResourceForDeletion = (namespace: string, mcpName: string): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/${namespace}/managedcontrolplanes/${mcpName}?fieldManager=kubectl-annotate`,
    method: 'PATCH',
    jq: undefined,
    body: undefined,
  };
};

export const DeleteMCPResource = (namespace: string, mcpName: string): Resource<undefined> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/namespaces/${namespace}/managedcontrolplanes/${mcpName}/`,
    method: 'DELETE',
    jq: undefined,
    body: undefined,
  };
};
