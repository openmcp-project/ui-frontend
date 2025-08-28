import { GenericHintCard } from './GenericHintCard/GenericHintCard';
import { useCrossplaneHintConfig, useGitOpsHintConfig, useVaultHintConfig, useVeleroHintConfig } from './GenericHintCard/genericHintConfigs';
import styles from './HintsCardsRow.module.css';

import { ControlPlaneType } from '../../lib/api/types/crate/controlPlanes';
import { ManagedResourcesRequest, ManagedResourcesResponse } from '../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../lib/shared/constants';
import { useApiResource } from '../../lib/api/useApiResource';
import { ManagedResourceItem } from '../../lib/shared/types';
import React, { useMemo } from 'react';
import Graph from '../Graphs/Graph';

interface HintsProps {
  mcp: ControlPlaneType;
}

// Export styles for use by hint components
export { default as styles } from './HintsCardsRow.module.css';

// Utility function to flatten managed resources
export const flattenManagedResources = (managedResources: ManagedResourcesResponse): ManagedResourceItem[] => {
  if (!managedResources || !Array.isArray(managedResources)) return [];

  return managedResources
    .filter((managedResource) => managedResource?.items)
    .flatMap((managedResource) => managedResource.items || []);
};

const HintsCardsRow: React.FC<HintsProps> = ({ mcp }) => {
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
  const veleroConfig = useVeleroHintConfig();

  return (
    <div className={styles.bentoContainer}>
      {/* Box 1: Main card - big box on top-left */}
      <div className={styles.mainCard}>
          <Graph />
      </div>
      
      {/* Right column: flexbox container for right side cards */}
      <div className={styles.rightColumn}>
        {/* Box 2: Top right card */}
          <div className={styles.middleRightCard}>
          <GenericHintCard
            enabled={!!mcp?.spec?.components?.crossplane}
            version={mcp?.spec?.components?.crossplane?.version}
            allItems={allItems}
            isLoading={managedResourcesLoading}
            error={managedResourcesError}
            config={crossplaneConfig}
                        height="150px"

          />
        </div>
      
        
        {/* Box 3: Middle right card (underneath box 2) */}
        <div className={styles.topRightCard}>
          <GenericHintCard
            enabled={!!mcp?.spec?.components?.flux}
            version={mcp?.spec?.components?.flux?.version}
            allItems={allItems}
            isLoading={managedResourcesLoading}
            error={managedResourcesError}
            config={gitOpsConfig}
                                    height="150px"

          />
        </div>
      </div>
      
      {/* Bottom row: flexbox container for bottom cards */}
      <div className={styles.bottomRow}>
        {/* Box 4: Bottom left card (underneath box 1) */}
        <div className={styles.bottomLeftCard}>
          <GenericHintCard
            enabled={!!mcp?.spec?.components?.externalSecretsOperator}
            version={mcp?.spec?.components?.externalSecretsOperator?.version}
            allItems={allItems}
            isLoading={managedResourcesLoading}
            error={managedResourcesError}
            config={vaultConfig}
            height="50px"
          />
        </div>
        
        {/* Box 5: Bottom right card (underneath box 3) */}
        <div className={styles.bottomRightCard}>
          <GenericHintCard
            enabled={!!mcp?.spec?.components?.externalSecretsOperator}
            version={mcp?.spec?.components?.externalSecretsOperator?.version}
            allItems={allItems}
            isLoading={managedResourcesLoading}
            error={managedResourcesError}
            config={veleroConfig}
            height="50px"
          />
        </div>
      </div>
    </div>
  );
};

export default HintsCardsRow;
