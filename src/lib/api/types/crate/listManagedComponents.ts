import { Resource } from '../resource';

interface ManagedComponentList {
  apiVersion: string;
  kind: string;
  items: ManagedComponent[];
  metadata: ListMetadata;
}

interface ListMetadata {
  continue: string;
  resourceVersion: string;
}

interface ManagedComponent {
  apiVersion: string;
  kind: string;
  metadata: ManagedComponentMetadata;
  spec: Record<string, unknown>;
  status: ManagedComponentStatus;
}

interface ManagedComponentMetadata {
  creationTimestamp: string;
  generation: number;
  managedFields: ManagedField[];
  name: string;
  resourceVersion: string;
  uid: string;
}

interface ManagedField {
  apiVersion: string;
  fieldsType: string;
  fieldsV1: FieldsV1;
  manager: string;
  operation: string;
  time: string;
  subresource?: string;
}

interface FieldsV1 {
  [key: string]: never;
}

interface ManagedComponentStatus {
  versions: string[];
}

export const ListManagedComponents = (): Resource<ManagedComponentList> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/managedcomponents`,
    jq: undefined,
  };
};
