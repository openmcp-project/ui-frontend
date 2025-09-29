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
  if (!resourceObject) {
    return resourceObject;
  }
  const processMetadata = (metadata: Resource['metadata']) => {
    const { managedFields, generation, uid, annotations, ...restMetadata } = metadata || {};

    const newAnnotations = { ...annotations };
    if (showOnlyImportantData) {
      delete newAnnotations['kubectl.kubernetes.io/last-applied-configuration'];
    }

    return {
      ...restMetadata,
      ...(Object.keys(newAnnotations).length > 0 && {
        annotations: newAnnotations,
      }),
    };
  };

  const processResource = (resource: Omit<Resource, 'items'>) => {
    const { metadata, ...restResource } = resource;
    return {
      ...restResource,
      ...(metadata && { metadata: processMetadata(metadata) }),
    };
  };

  if (resourceObject?.items) {
    return {
      ...resourceObject,
      items: resourceObject.items.map(processResource),
    };
  }

  return processResource(resourceObject);
};
