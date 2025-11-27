import { Resource } from './removeManagedFieldsAndFilterData.ts';

export interface ResourceApiInfo {
  apiGroupName: string;
  apiVersion: string;
  kind: string;
}

export function parseResourceApiInfo(resource: Resource): ResourceApiInfo {
  const apiVersionString = resource?.apiVersion ?? 'core.openmcp.cloud/v1alpha1';
  const [apiGroupName, apiVersion] = apiVersionString.includes('/')
    ? apiVersionString.split('/')
    : ['core', apiVersionString];

  const kind = resource?.kind ?? '';

  return {
    apiGroupName,
    apiVersion,
    kind,
  };
}
