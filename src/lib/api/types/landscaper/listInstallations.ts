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

export interface InstallationsListResponse {
  items: Installation[];
}

export const InstallationsRequest = (namespace: string): Resource<InstallationsListResponse> => ({
  path: `/apis/landscaper.gardener.cloud/v1alpha1/namespaces/${namespace}/installations`,
});
