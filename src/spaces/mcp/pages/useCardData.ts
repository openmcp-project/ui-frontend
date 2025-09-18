import { useMemo } from 'react';
import { ManagedResourceItem } from '../../../lib/shared/types';

// Utility function to flatten managed resources
const flattenManagedResources = (managedResources: any): ManagedResourceItem[] => {
  if (!managedResources || !Array.isArray(managedResources)) return [];

  return managedResources
    .filter((managedResource) => managedResource?.items)
    .flatMap((managedResource) => managedResource.items || []);
};

export const useCardData = (managedResources: any, mcp: any) => {
  // Flatten all managed resources once and pass to components
  const allItems = useMemo(
    () => flattenManagedResources(managedResources),
    [managedResources],
  );

  // Prepare member items from role bindings
  const memberItems = useMemo(
    () => (mcp?.spec?.authorization?.roleBindings || []).map((rb: any) => ({ role: rb.role })),
    [mcp?.spec?.authorization?.roleBindings]
  );

  return {
    allItems,
    memberItems,
  };
};