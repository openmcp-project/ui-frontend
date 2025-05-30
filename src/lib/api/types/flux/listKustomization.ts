import { Resource } from '../resource';

export type KustomizationsResponse = {
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

export const FluxKustomization: Resource<KustomizationsResponse> = {
  path: '/apis/kustomize.toolkit.fluxcd.io/v1/kustomizations',
};
