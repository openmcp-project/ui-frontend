import { Resource } from '../resource';

interface ExecutionsListResponse {
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

export const ExecutionsRequest = (
  namespace: string,
): Resource<ExecutionsListResponse> => ({
  path: `/apis/landscaper.gardener.cloud/v1alpha1/namespaces/${namespace}/executions`,
});
