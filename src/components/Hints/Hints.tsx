import { FlexBox, FlexBoxDirection } from '@ui5/webcomponents-react';
import { CrossplaneHint } from './CrossplaneHint';
import { GitOpsHint } from './GitOpsHint';
import { VaultHint } from './VaultHint';

import { ControlPlaneType } from '../../lib/api/types/crate/controlPlanes';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../lib/shared/constants';
import { useApiResource } from '../../lib/api/useApiResource';
import { ManagedResourceItem } from '../../lib/shared/types';
import React, { useMemo } from 'react';

interface HintsProps {
  mcp: ControlPlaneType;
}

// Export styles for use by hint components
export { default as styles } from './Hints.module.css';

// Utility function to flatten managed resources
export const flattenManagedResources = (managedResources: any): ManagedResourceItem[] => {
  if (!managedResources || !Array.isArray(managedResources)) return [];

  return managedResources
    .filter((managedResource) => managedResource?.items)
    .flatMap((managedResource) => managedResource.items || []);
};

const Hints: React.FC<HintsProps> = ({ mcp }) => {
  const {
    data: managedResources,
    isLoading: managedResourcesLoading,
    error: managedResourcesError,
  } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval,
  });

  // Flatten all managed resources once and pass to components
  const allItems = useMemo(() => flattenManagedResources(managedResources), [managedResources]);

  return (
    <FlexBox
      direction={FlexBoxDirection.Row}
      style={{
        gap: '12px',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        width: '100%',
        // This breaks the scrolling currently since its zIndex is higher than the header bar
        // height: '150px',
        // zIndex: 9999,
        // position: 'relative',
      }}
    >
      <CrossplaneHint
        enabled={!!mcp?.spec?.components?.crossplane}
        version={mcp?.spec?.components?.crossplane?.version}
        allItems={allItems}
        isLoading={managedResourcesLoading}
        error={managedResourcesError}
      />
      <GitOpsHint
        enabled={!!mcp?.spec?.components?.flux}
        version={mcp?.spec?.components?.flux?.version}
        allItems={allItems}
        isLoading={managedResourcesLoading}
        error={managedResourcesError}
      />
      <VaultHint
        enabled={!!mcp?.spec?.components?.externalSecretsOperator}
        version={mcp?.spec?.components?.externalSecretsOperator?.version}
        allItems={allItems}
        isLoading={managedResourcesLoading}
        error={managedResourcesError}
      />
    </FlexBox>
  );
};

export default Hints;
