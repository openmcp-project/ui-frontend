import { Resource } from '../resource';

export interface CreateGitRepositoryType {
  apiVersion: 'source.toolkit.fluxcd.io/v1';
  kind: 'GitRepository';
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    interval: string;
    url: string;
    ref: {
      branch: string;
    };
    secretRef?: {
      name: string;
    };
  };
}

export const CreateGitRepositoryResource = (namespace: string, name: string): Resource<CreateGitRepositoryType> => ({
  path: `/apis/source.toolkit.fluxcd.io/v1/namespaces/${namespace}/gitrepositories/${name}`,
  method: 'POST',
});
