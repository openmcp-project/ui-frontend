import { LAST_APPLIED_CONFIGURATION_ANNOTATION } from '../lib/api/types/shared/keyNames';

export type Resource = {
  apiVersion: string;
  kind: string;
  items?: Omit<Resource, 'items'>[];
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: {
      [LAST_APPLIED_CONFIGURATION_ANNOTATION]?: string;
      [key: string]: string | undefined;
    };
    managedFields?: unknown;
    creationTimestamp?: string;
    finalizers?: string[];
    generation?: number;
    resourceVersion?: string;
    uid?: string;
  };
  spec?: unknown;
  status?: unknown;
};

export const removeManagedFieldsProperty = (resourceObject: Resource, showOnlyImportantData: boolean) => {
  console.log(resourceObject);
  if (resourceObject?.metadata?.managedFields) {
    return {
      ...resourceObject,
      metadata: {
        ...resourceObject.metadata,
        managedFields: undefined,
        annotations: {
          ...resourceObject.metadata.annotations,
          [LAST_APPLIED_CONFIGURATION_ANNOTATION]: showOnlyImportantData
            ? undefined
            : resourceObject?.metadata?.annotations?.[LAST_APPLIED_CONFIGURATION_ANNOTATION],
        },
        generation: showOnlyImportantData ? undefined : resourceObject?.metadata?.generation,
        uid: showOnlyImportantData ? undefined : resourceObject?.metadata?.uid,
      },
    };
  }
  if (resourceObject?.items) {
    return {
      ...resourceObject,
      items: resourceObject.items.map((item) => ({
        ...item,
        metadata: {
          ...item.metadata,
          managedFields: undefined,
          annotations: {
            ...resourceObject.metadata.annotations,
            [LAST_APPLIED_CONFIGURATION_ANNOTATION]: showOnlyImportantData
              ? undefined
              : resourceObject?.metadata?.annotations?.[LAST_APPLIED_CONFIGURATION_ANNOTATION],
          },
          generation: showOnlyImportantData ? undefined : resourceObject?.metadata?.generation,
          uid: showOnlyImportantData ? undefined : resourceObject?.metadata?.uid,
        },
      })),
    };
  }

  return resourceObject;
};
