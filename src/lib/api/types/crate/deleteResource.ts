import { Resource } from '../resource';

export interface DeleteManagedResourceType {
  name: string;
  namespace: string;
}

export const PatchResourceForForceDeletionBody = {
  metadata: {
    finalizers: {},
  },
};

export const PatchResourceForForceDeletion = (
  apiVersion: string,
  kind: string,
  resourceName: string,
): Resource<undefined> => {
  return {
    path: `/apis/${apiVersion}/${kind}/${resourceName}/`,
    method: 'PATCH',
    jq: undefined,
    body: undefined,
  };
};

export const DeleteMCPManagedResource = (
  apiVersion: string,
  kind: string,
  resourceName: string,
): Resource<undefined> => {
  return {
    path: `/apis/${apiVersion}/${kind}/${resourceName}/`,
    method: 'DELETE',
    jq: undefined,
    body: undefined,
  };
};
