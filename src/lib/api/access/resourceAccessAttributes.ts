import type { AccessAttributes } from './useCanI.ts';

export interface AccessResource {
  apiVersion?: string;
  metadata: { name: string; namespace?: string };
}

export function resourceAccessAttributes(
  item: AccessResource,
  resource: string,
  verb: AccessAttributes['verb'],
): AccessAttributes | null {
  if (!item.apiVersion || !resource || !item.metadata.name) return null;
  return {
    verb,
    group: item.apiVersion.includes('/') ? item.apiVersion.split('/')[0] : '',
    resource,
    namespace: item.metadata.namespace || undefined,
    name: item.metadata.name,
  };
}
