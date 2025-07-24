import { Resource } from '../resource';

export interface Execution {
  objectName: string;
  metadata: {
    name: string;
    namespace: string;
    uid: string;
  };
  status?: {
    phase?: string;
    deployItemCache?: {
      activeDIs?: {
        objectName: string;
      }[];
    };
  };
}

export interface ExecutionsListResponse {
  items: Execution[];
}

export const ExecutionsRequest = (namespace: string): Resource<ExecutionsListResponse> => ({
  path: `/apis/landscaper.gardener.cloud/v1alpha1/namespaces/${namespace}/executions`,
});
