import { Resource } from '../resource';

export type CRDResponse = {
  items: [
    {
      metadata: {
        name: string;
        creationTimestamp: string;
        ownerReferences: [
          {
            kind: string;
            name: string;
          },
        ];
      };
      status: {
        conditions: [
          {
            type: 'Ready' | 'Synced' | unknown;
            status: 'True' | 'False';
            lastTransitionTime: string;
          },
        ];
      };
      spec: {
        names: {
          kind: string;
        };
        versions: [
          {
            name: string;
          },
        ];
        group: string;
      };
    },
  ];
};

export const CRDRequest: Resource<CRDResponse> = {
  path: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions',
  // Strip OpenAPI schemas / printer columns / accepted names — none of those
  // are consumed on the client. Keep only the fields the call sites read.
  jq: '{items: [.items[] | {metadata: {name: .metadata.name, creationTimestamp: .metadata.creationTimestamp, ownerReferences: (.metadata.ownerReferences // [])}, status: {conditions: (.status.conditions // [])}, spec: {names: {kind: .spec.names.kind, singular: .spec.names.singular, plural: .spec.names.plural}, group: .spec.group, versions: [.spec.versions[] | {name}]}}]}',
};

export const CRDRequestAuthCheck: Resource<CRDResponse> = {
  path: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions',
  jq: '{kind: .kind}',
};
