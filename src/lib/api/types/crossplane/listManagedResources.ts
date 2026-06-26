import { ManagedResourceItem } from '../../../shared/types';
import { Resource } from '../resource';

export type ManagedResourcesResponse = [
  {
    items: [ManagedResourceItem];
  },
];

export const ManagedResourcesRequest: Resource<ManagedResourcesResponse> = {
  path: '/managed',
  // metadata.managedFields is several KB per item and unused on the client.
  jq: 'del(.[].items[].metadata.managedFields)',
};
