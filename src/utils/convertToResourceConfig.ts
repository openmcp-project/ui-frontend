import { LAST_APPLIED_CONFIGURATION_ANNOTATION } from '../lib/api/types/shared/keyNames';
import type { Resource } from './removeManagedFieldsAndFilterData';

/**
 * Convert an in-cluster Resource (which may contain status and server-populated metadata)
 * into a lean manifest suitable for applying with kubectl.
 * Rules:
 *  - Keep: apiVersion, kind, metadata.name, metadata.namespace, metadata.labels, metadata.annotations (except LAST_APPLIED_CONFIGURATION_ANNOTATION), metadata.finalizers, spec.
 *  - Remove: metadata.managedFields, metadata.resourceVersion, metadata.uid, metadata.generation, metadata.creationTimestamp,
 *            LAST_APPLIED_CONFIGURATION_ANNOTATION annotation, status.
 *  - If a List (has items), convert each item recursively.
 */
export const convertToResourceConfig = (resourceObject: Resource | undefined | null): Resource => {
  if (!resourceObject) return {} as Resource;

  const base: Resource = {
    apiVersion: resourceObject.apiVersion,
    kind: resourceObject.kind,
    metadata: {
      name: resourceObject.metadata?.name || '',
    },
  } as Resource;

  if (resourceObject.metadata?.namespace) {
    base.metadata.namespace = resourceObject.metadata.namespace;
  }
  if (resourceObject.metadata?.labels && Object.keys(resourceObject.metadata.labels).length > 0) {
    base.metadata.labels = { ...resourceObject.metadata.labels };
  }
  if (resourceObject.metadata?.annotations) {
    const filtered = { ...resourceObject.metadata.annotations };
    delete filtered[LAST_APPLIED_CONFIGURATION_ANNOTATION];
    // Remove empty annotation object
    const keys = Object.keys(filtered).filter((k) => filtered[k] !== undefined && filtered[k] !== '');
    if (keys.length > 0) {
      base.metadata.annotations = keys.reduce<Record<string, string>>((acc, k) => {
        const v = filtered[k];
        if (typeof v === 'string') acc[k] = v;
        return acc;
      }, {});
    }
  }
  if (resourceObject.metadata?.finalizers && resourceObject.metadata.finalizers.length > 0) {
    base.metadata.finalizers = [...resourceObject.metadata.finalizers];
  }
  if (resourceObject.spec !== undefined) {
    base.spec = resourceObject.spec;
  }

  // If list: map items
  if (resourceObject.items) {
    base.items = resourceObject.items.map((it) => convertToResourceConfig(it));
  }

  return base;
};
