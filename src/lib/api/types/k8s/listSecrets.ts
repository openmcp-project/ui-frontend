import { Resource } from '../resource';

export type ListSecretsType = {
  items: [
    {
      kind: string;
      metadata: {
        name: string;
        namespace: string;
      };
    },
  ];
};

export const ListSecrets = (namespace: string): Resource<ListSecretsType> => ({
  path: `/api/v1/namespaces/${namespace}/secrets`,
  jq: '[.items[] | {metadata: .metadata | {name}}]',
});