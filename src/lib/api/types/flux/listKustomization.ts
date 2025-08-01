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
            message: string;
            status: string;
            type: string;
            lastTransitionTime: string;
            reason: string;
          },
        ];
      };
    },
  ];
};

export const FluxKustomization: Resource<KustomizationsResponse> = {
  path: '/apis/kustomize.toolkit.fluxcd.io/v1/kustomizations',
};
