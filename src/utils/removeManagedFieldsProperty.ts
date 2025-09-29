export type Resource = {
  apiVersion: string;
  kind: string;
  items?: Omit<Resource, 'items'>[];
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: {
      'kubectl.kubernetes.io/last-applied-configuration'?: string;
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
          'kubectl.kubernetes.io/last-applied-configuration': showOnlyImportantData
            ? undefined
            : resourceObject?.metadata?.annotations?.['kubectl.kubernetes.io/last-applied-configuration'],
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
            'kubectl.kubernetes.io/last-applied-configuration': showOnlyImportantData
              ? undefined
              : resourceObject?.metadata?.annotations?.['kubectl.kubernetes.io/last-applied-configuration'],
          },
          generation: showOnlyImportantData ? undefined : resourceObject?.metadata?.generation,
          uid: showOnlyImportantData ? undefined : resourceObject?.metadata?.uid,
        },
      })),
    };
  }

  return resourceObject;
};
