import { Resource } from '../resource';

interface DeployItemsListResponse {
  items: [
    {
      metadata: {
        name: string;
        namespace: string;
        uid: string;
        ownerReferences: {
          uid: string;
        }[];
      };
      status: {
        phase: string;
      };
    },
  ];
}

export const DeployItemsRequest = (
  namespace: string,
): Resource<DeployItemsListResponse> => ({
  path: `/apis/landscaper.gardener.cloud/v1alpha1/namespaces/${namespace}/installations`,
});
