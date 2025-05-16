export type Resource = {
  kind: string;
  items?: {
    metadata: {
      name: string;
      managedFields?: unknown;
    };
  }[];
  metadata: {
    name: string;
    managedFields?: unknown;
  };
};

export const removeManagedFieldsProperty = (resourceObject: Resource) => {
  if (resourceObject?.metadata?.managedFields) {
    return {
      ...resourceObject,
      metadata: {
        ...resourceObject.metadata,
        managedFields: undefined,
      },
    };
  }
  if (resourceObject?.items) {
    return {
      ...resourceObject,
      items: resourceObject.items.map((item) => ({
        ...item,
        metadata: { ...item.metadata, managedFields: undefined },
      })),
    };
  }

  return resourceObject;
};
