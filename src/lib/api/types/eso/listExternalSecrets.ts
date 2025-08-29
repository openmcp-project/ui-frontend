import { Resource } from '../resource';

export type ESOResponse = {
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
        binding: {
          name: string;
        };
        conditions?: [
          {
            status: string;
            type: string;
            lastTransitionTime: string;
            message?: string;
            reason?: string;
          },
        ];
      };
    },
  ];
};

export const EsoExternalSecretsRequest: Resource<ESOResponse> = {
  path: '/apis/external-secrets.io/v1/externalsecrets',
};
