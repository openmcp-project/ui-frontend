import { Resource } from '../resource';

export interface Installation {
  objectName: string;
  metadata: {
    name: string;
    namespace: string;
    uid: string;
  };
  status?: {
    phase?: string;
    executionRef?: {
      name: string;
      namespace: string;
    };
    subInstCache?: {
      activeSubs?: {
        objectName: string;
      }[];
    };
  };
}

export interface InstalationsListResponse {
  items: Installation[];
}

export const InstalationsRequest = (
  namespace: string,
): Resource<InstalationsListResponse> => ({
  path: `/apis/landscaper.gardener.cloud/v1alpha1/namespaces/${namespace}/installations`,
});
