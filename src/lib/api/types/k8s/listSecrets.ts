import type { Resource } from '../resource';

export interface SecretListItem {
  metadata: {
    name: string;
    namespace?: string;
    creationTimestamp?: string;
  };
  type?: string;

  // K8s Secret payload (data values are base64-encoded)
  data?: Record<string, string>;
  stringData?: Record<string, string>;
}

export const SecretsResource = (namespace: string): Resource<SecretListItem[]> => ({
  path: `/api/v1/namespaces/${namespace}/secrets`,
  jq: '[.items[] | { metadata: { name: .metadata.name, namespace: .metadata.namespace, creationTimestamp: .metadata.creationTimestamp }, type: .type, data: .data, stringData: .stringData }]',
});
