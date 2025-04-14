import { Resource } from '../resource';

export type GitReposResponse = {
  items: [
    {
      spec: {
        package: string;
      };
      kind: string;
      metadata: {
        name: string;
        creationTimestamp: string;
      };
      status: {
        artifact: {
          revision: string;
        };
        conditions: [
          {
            status: string;
            type: string;
            lastTransitionTime: string;
          },
        ];
      };
    },
  ];
};

export const FluxRequest: Resource<GitReposResponse> = {
  path: '/apis/source.toolkit.fluxcd.io/v1/gitrepositories',
};
