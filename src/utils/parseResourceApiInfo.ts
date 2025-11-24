import { Resource } from './removeManagedFieldsAndFilterData.ts';

export interface ResourceApiInfo {
  apiGroupName: string;
  apiVersion: string;
  kind: string;
}

export function parseResourceApiInfo(resource: Resource): ResourceApiInfo {
  const apiGroupName = resource?.apiVersion?.split('/')[0] ?? 'core.openmcp.cloud';
  const apiVersion = resource?.apiVersion?.split('/')[1] ?? 'v1alpha1';
  const kind = resource?.kind ?? '';

  return {
    apiGroupName,
    apiVersion,
    kind,
  };
}
