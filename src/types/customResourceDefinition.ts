export interface CustomResourceDefinition {
  kind: 'CustomResourceDefinition';
  apiVersion: 'apiextensions.k8s.io/v1';
  metadata: {
    name: string;
    uid: string;
    resourceVersion: string;
    generation: number;
    creationTimestamp: string;
    managedFields?: {
      manager: string;
      operation: string;
      apiVersion: string;
      time: string;
      fieldsType: string;
      fieldsV1?: Record<string, unknown>;
      subresource?: string;
    }[];
  };
  spec: {
    group: string;
    names: {
      plural: string;
      singular: string;
      shortNames?: string[];
      kind: string;
      listKind: string;
    };
    scope: 'Namespaced' | 'Cluster';
    versions: {
      name: string;
      served: boolean;
      storage: boolean;
      schema: {
        openAPIV3Schema: JSONSchemaProps;
      };
      subresources?: {
        status?: Record<string, unknown>;
        scale?: Record<string, unknown>;
      };
      additionalPrinterColumns?: {
        name: string;
        type: string;
        jsonPath: string;
        description?: string;
        format?: string;
        priority?: number;
      }[];
    }[];
    conversion: {
      strategy: 'None' | 'Webhook';
      webhook?: Record<string, unknown>;
    };
  };
  status?: {
    conditions?: {
      type: string;
      status: 'True' | 'False' | 'Unknown';
      lastTransitionTime: string;
      reason: string;
      message: string;
    }[];
    acceptedNames?: {
      plural: string;
      singular: string;
      shortNames?: string[];
      kind: string;
      listKind: string;
    };
    storedVersions?: string[];
  };
}

// JSON Schema Props interface for OpenAPI V3 Schema
export interface JSONSchemaProps {
  description?: string;
  type?: string;
  format?: string;
  title?: string;
  default?: unknown;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  enum?: unknown[];
  properties?: Record<string, JSONSchemaProps>;
  additionalProperties?: boolean | JSONSchemaProps;
  items?: JSONSchemaProps | JSONSchemaProps[];
  allOf?: JSONSchemaProps[];
  oneOf?: JSONSchemaProps[];
  anyOf?: JSONSchemaProps[];
  not?: JSONSchemaProps;
  nullable?: boolean;
  'x-kubernetes-preserve-unknown-fields'?: boolean;
  'x-kubernetes-validations'?: {
    rule: string;
    message: string;
    messageExpression?: string;
    reason?: string;
    fieldPath?: string;
  }[];
  'x-kubernetes-embedded-resource'?: boolean;
  'x-kubernetes-int-or-string'?: boolean;
  'x-kubernetes-list-map-keys'?: string[];
  'x-kubernetes-list-type'?: 'atomic' | 'set' | 'map';
  'x-kubernetes-map-type'?: 'atomic' | 'granular';
}
