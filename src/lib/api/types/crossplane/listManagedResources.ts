import { ManagedResourceItem } from '../../../shared/types';
import { Resource } from '../resource';

export type ManagedResourcesResponse = {
  items: [ManagedResourceItem];
};

export const ManagedResourcesRequest: Resource<ManagedResourcesResponse> = {
  path: '/managed',
};
