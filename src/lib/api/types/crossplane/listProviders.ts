import { Resource } from '../resource';

  export type ProvidersListResponse = {
    items: [{
      kind: string;
      metadata: {
        name: string;
        creationTimestamp: string;
      };
      status: {
        conditions: [{
          type: "Ready" | "Synced" | unknown;
        }]
      };
    }];
  };
  
  export const ProvidersListRequest: Resource<ProvidersListResponse> = {
    path: "/apis/pkg.crossplane.io/v1/providers",
  };