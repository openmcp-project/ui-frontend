import { Resource } from '../resource';

export interface DeployItem {
  objectName: string;
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    ownerReferences: { uid: string }[];
  };
  status: {
    phase: string;
  };
}

export interface DeployItemsListResponse {
  items: DeployItem[];
}

export const DeployItemsRequest = (namespace: string): Resource<DeployItemsListResponse> => ({
  path: `/apis/landscaper.gardener.cloud/v1alpha1/namespaces/${namespace}/deployitems`,
});
