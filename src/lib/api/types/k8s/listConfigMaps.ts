import type { Resource } from '../resource';

export interface ConfigMapListItem {
  metadata: {
    name: string;
    namespace?: string;
    creationTimestamp?: string;
  };
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
}

export const ConfigMapsResource = (namespace: string): Resource<ConfigMapListItem[]> => ({
  path: `/api/v1/namespaces/${namespace}/configmaps`,
  jq: '[.items[] | { metadata: { name: .metadata.name, namespace: .metadata.namespace, creationTimestamp: .metadata.creationTimestamp }, data: .data, binaryData: .binaryData }]',
});
