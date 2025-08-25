import { FlexBox, FlexBoxDirection } from '@ui5/webcomponents-react';
import { GenericHint } from './GenericHint';
import { useCrossplaneHintConfig, useGitOpsHintConfig, useVaultHintConfig } from './hintConfigs';

import { ControlPlaneType } from '../../lib/api/types/crate/controlPlanes';
import { ManagedResourcesRequest, ManagedResourcesResponse } from '../../lib/api/types/crossplane/listManagedResources';
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
export const flattenManagedResources = (managedResources: ManagedResourcesResponse): ManagedResourceItem[] => {
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
  const allItems = useMemo(
    () => flattenManagedResources(managedResources ?? ([] as unknown as ManagedResourcesResponse)),
    [managedResources],
  );

  // Get hint configurations
  const crossplaneConfig = useCrossplaneHintConfig();
  const gitOpsConfig = useGitOpsHintConfig();
  const vaultConfig = useVaultHintConfig();

  return (
    <FlexBox
      direction={FlexBoxDirection.Row}
      style={{
        gap: '12px',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',

        // This breaks the scrolling currently since its zIndex is higher than the header bar
        // height: '150px',
        // zIndex: 9999,
        // position: 'relative',
      }}
    >
      <GenericHint
        enabled={!!mcp?.spec?.components?.crossplane}
        version={mcp?.spec?.components?.crossplane?.version}
        allItems={allItems}
        isLoading={managedResourcesLoading}
        error={managedResourcesError}
        config={crossplaneConfig}
        onActivate={!mcp?.spec?.components?.crossplane ? () => console.log('Activate Crossplane') : undefined} // TODO: replace with link to docs
      />
      <GenericHint
        enabled={!!mcp?.spec?.components?.flux}
        version={mcp?.spec?.components?.flux?.version}
        allItems={allItems}
        isLoading={managedResourcesLoading}
        error={managedResourcesError}
        config={gitOpsConfig}
        onActivate={!mcp?.spec?.components?.flux ? () => console.log('Activate Flux') : undefined} // TODO: replace with link to docs
      />
      <GenericHint
        enabled={!!mcp?.spec?.components?.externalSecretsOperator}
        version={mcp?.spec?.components?.externalSecretsOperator?.version}
        allItems={allItems}
        isLoading={managedResourcesLoading}
        error={managedResourcesError}
        config={vaultConfig}
        onActivate={!mcp?.spec?.components?.externalSecretsOperator ? () => console.log('Activate Vault') : undefined} // TODO: replace with link to docs
      />
    </FlexBox>
  );
};

export default Hints;
