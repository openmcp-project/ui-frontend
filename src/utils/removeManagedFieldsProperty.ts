export type Resource = {
  kind: string;
  metadata: {
    managedFields?: unknown;
  };
};

export const removeManagedFieldsProperty = (resourceObject: Resource) => {
  return resourceObject?.metadata?.managedFields
    ? {
        ...resourceObject,
        metadata: {
          ...resourceObject.metadata,
          managedFields: undefined,
        },
      }
    : resourceObject;
};
