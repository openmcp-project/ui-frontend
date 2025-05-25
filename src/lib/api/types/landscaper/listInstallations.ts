import { Resource } from '../resource';

interface InstalationsListResponse {
  items: [
    {
      metadata: {
        name: string;
        namespace: string;
        creationTimestamp: string;
      };
      status: {
        phase: string;
      };
    },
  ];
}

export const InstalationsRequest = (
  namespace: string,
): Resource<InstalationsListResponse> => ({
  path: `/apis/landscaper.gardener.cloud/v1alpha1/namespaces/${namespace}/installations`,
});
