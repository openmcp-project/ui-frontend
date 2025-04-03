import { Resource } from '../resource';

export type ProvidersListResponse = {
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
        conditions: [
          {
            type: 'Healthy' | 'Installed' | unknown;
            status: 'True' | 'False';
            lastTransitionTime: string;
          },
        ];
      };
    },
  ];
};

export const ProvidersListRequest: Resource<ProvidersListResponse> = {
  path: '/apis/pkg.crossplane.io/v1/providers',
};
