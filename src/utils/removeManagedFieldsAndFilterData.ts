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

const cleanUpResource = (
  resource: Omit<Resource, 'items'>,
  showOnlyImportantData: boolean,
): Omit<Resource, 'items'> => {
  const newResource = { ...resource };

  if (newResource.metadata) {
    newResource.metadata = { ...newResource.metadata };
    delete newResource.metadata.managedFields;

    if (showOnlyImportantData) {
      if (newResource.metadata.annotations) {
        newResource.metadata.annotations = { ...newResource.metadata.annotations };
        delete newResource.metadata.annotations[LAST_APPLIED_CONFIGURATION_ANNOTATION];
      }
      delete newResource.metadata.generation;
      delete newResource.metadata.uid;
      delete newResource.metadata.resourceVersion;
    }
  }

  return newResource;
};

export const removeManagedFieldsAndFilterData = (
  resourceObject: Resource,
  showOnlyImportantData: boolean,
): Resource => {
  if (!resourceObject) {
    return {} as Resource;
  }
  if (resourceObject.items) {
    return {
      ...cleanUpResource(resourceObject, showOnlyImportantData),
      items: resourceObject.items.map((item) => cleanUpResource(item, showOnlyImportantData)),
    };
  }

  return cleanUpResource(resourceObject, showOnlyImportantData);
};
