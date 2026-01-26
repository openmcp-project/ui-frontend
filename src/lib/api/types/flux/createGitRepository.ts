export type CreateGitRepositoryType = {
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
      branch?: string;
      tag?: string;
      commit?: string;
      semver?: string;
      name?: string;
    };
    secretRef?: {
      name: string;
    };
  };
};
