import { Resource } from "../resource";

export type ManagedResourcesResponse = [{
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
}];

export const ManagedResourcesRequest: Resource<ManagedResourcesResponse> = {
  path: "/managed",
};
