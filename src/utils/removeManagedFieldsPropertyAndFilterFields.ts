export type Resource = {
  kind: string;
  items?: {
    metadata: {
      name: string;
      managedFields?: unknown;
      annotations: { 'kubectl.kubernetes.io/last-applied-configuration'?: string };
      generation?: number;
    };
  }[];
  metadata: {
    name: string;
    managedFields?: unknown;
    annotations: { 'kubectl.kubernetes.io/last-applied-configuration'?: string };
    generation?: number;
  };
};

export const removeManagedFieldsPropertyAndFilterFields = (
  resourceObject: Resource,
  showOnlyImportantFields: boolean,
) => {
  if (resourceObject?.metadata?.managedFields && !showOnlyImportantFields) {
    return {
      ...resourceObject,
      metadata: {
        ...resourceObject.metadata,
        managedFields: undefined,
      },
      generation: undefined,
    };
  }
  if (resourceObject?.items && !showOnlyImportantFields) {
    return {
      ...resourceObject,
      items: resourceObject.items.map((item) => ({
        ...item,
        metadata: { ...item.metadata, managedFields: undefined },
        generation: undefined,
      })),
    };
  }

  if (resourceObject?.metadata?.managedFields && showOnlyImportantFields) {
    return {
      ...resourceObject,
      metadata: {
        ...resourceObject.metadata,
        managedFields: undefined,
        annotations: {
          ...resourceObject.metadata.annotations,
          'kubectl.kubernetes.io/last-applied-configuration': undefined,
          generation: undefined,
        },
      },
    };
  }
  if (resourceObject?.items && showOnlyImportantFields) {
    return {
      ...resourceObject,
      items: resourceObject.items.map((item) => ({
        ...item,
        metadata: {
          ...item.metadata,
          managedFields: undefined,
          annotations: {
            ...item.metadata.annotations,
            'kubectl.kubernetes.io/last-applied-configuration': undefined,
            generation: undefined,
          },
        },
      })),
    };
  }

  return resourceObject;
};
