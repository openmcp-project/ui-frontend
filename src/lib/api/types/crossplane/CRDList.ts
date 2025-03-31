import { Resource } from '../resource';

export type CRDResponse = {
  items: [
    {
      metadata: {
        name: string;
        creationTimestamp: string;
      };
      status: {
        conditions: [
          {
            type: 'Ready' | 'Synced' | unknown;
            status: 'True' | 'False';
            lastTransitionTime: string;
          },
        ];
      };
      spec: {
        names: {
          kind: string;
        };
        versions: [
          {
            name: string;
          },
        ];
        group: string;
      };
    },
  ];
};

export const CRDRequest: Resource<CRDResponse> = {
  path: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions',
};
