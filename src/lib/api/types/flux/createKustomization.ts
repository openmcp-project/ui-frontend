export type CreateKustomizationType = {
  apiVersion: 'kustomize.toolkit.fluxcd.io/v1';
  kind: 'Kustomization';
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    interval: string;
    sourceRef: {
      kind: string;
      name: string;
    };
    path: string;
    prune: boolean;
    targetNamespace?: string;
    serviceAccountName?: string;
    postBuild?: {
      substitute: Record<string, string>;
    };
  };
};
