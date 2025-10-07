import { Resource } from '../resource';

export interface DeleteManagedResourceType {
  name: string;
  namespace: string;
}

export const PatchResourceForForceDeletionBody = {
  metadata: {
    finalizers: null,
  },
};

export const PatchResourceForForceDeletion = (
  apiVersion: string,
  pluralKind: string,
  resourceName: string,
  namespace?: string,
): Resource<undefined> => {
  // If namespace is provided, use namespaced path; otherwise, use cluster-scoped path
  const basePath = `/apis/${apiVersion}`;

  const path = namespace
    ? `${basePath}/namespaces/${namespace}/${pluralKind}/${resourceName}`
    : `${basePath}/${pluralKind}/${resourceName}`;

  return {
    path: path,
    method: 'PATCH',
    jq: undefined,
    body: undefined,
  };
};

export const DeleteMCPManagedResource = (
  apiVersion: string,
  pluralKind: string,
  resourceName: string,
  namespace?: string,
): Resource<undefined> => {
  // If namespace is provided, use namespaced path; otherwise, use cluster-scoped path
  const basePath = `/apis/${apiVersion}`;

  const path = namespace
    ? `${basePath}/namespaces/${namespace}/${pluralKind}/${resourceName}`
    : `${basePath}/${pluralKind}/${resourceName}`;
  return {
    path: path,
    method: 'DELETE',
    jq: undefined,
    body: undefined,
  };
};
