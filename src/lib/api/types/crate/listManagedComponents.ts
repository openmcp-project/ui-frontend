import { Resource } from '../resource';

export interface ManagedComponentList {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    continue?: string;
    resourceVersion?: string;
    [key: string]: unknown;
  };
  items?: ManagedComponent[];
}

export interface ManagedComponent {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    creationTimestamp?: string;
    generation?: number;
    managedFields?: ManagedField[];
    name?: string;
    resourceVersion?: string;
    uid?: string;
    [key: string]: unknown;
  };
  spec?: Record<string, unknown>;
  status?: {
    versions?: string[];
    [key: string]: unknown;
  };
}

export interface ManagedField {
  apiVersion?: string;
  fieldsType?: string;
  fieldsV1?: Record<string, unknown>;
  manager?: string;
  operation?: string;
  time?: string;
  subresource?: string;
  [key: string]: unknown;
}

export const ListManagedComponents = (): Resource<ManagedComponentList> => {
  return {
    path: `/apis/core.openmcp.cloud/v1alpha1/managedcomponents`,
    jq: undefined,
  };
};
