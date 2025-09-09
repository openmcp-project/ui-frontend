import { ComponentCard } from '../BentoGrid/ComponentCard/ComponentCard';
import { useCrossplaneHintConfig, useGitOpsHintConfig, useVaultHintConfig, useVeleroHintConfig } from './GenericHintCard/genericHintConfigs';
import { BentoGrid, BentoCard, GraphCard } from '../BentoGrid';
import styles from './HintsCardsRow.module.css';

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
    <BentoGrid className={styles.bentoContainer}>
      {/* Left side: Graph in extra-large (top) */}
      <BentoCard size="extra-large" gridColumn="1 / 9" gridRow="1 / 5">
        <GraphCard title="Resource Dependencies" />
      </BentoCard>

      {/* Left side: Crossplane component in large (bottom) */}
      <BentoCard size="large" gridColumn="1 / 9" gridRow="5 / 7">
        <ComponentCard
          enabled={!!mcp?.spec?.components?.crossplane}
          version={mcp?.spec?.components?.crossplane?.version}
          allItems={allItems}
          isLoading={managedResourcesLoading}
          error={managedResourcesError}
          config={crossplaneConfig}
        />
      </BentoCard>

      {/* Right side: First medium component (GitOps) */}
      <BentoCard size="medium" gridColumn="9 / 13" gridRow="1 / 3">
        <ComponentCard
          enabled={!!mcp?.spec?.components?.flux}
          version={mcp?.spec?.components?.flux?.version}
          allItems={allItems}
          isLoading={managedResourcesLoading}
          error={managedResourcesError}
          config={gitOpsConfig}
        />
      </BentoCard>

      {/* Right side: Second medium component (GitOps copy) */}
      <BentoCard size="medium" gridColumn="9 / 13" gridRow="3 / 5">
        <ComponentCard
          enabled={!!mcp?.spec?.components?.flux}
          version={mcp?.spec?.components?.flux?.version}
          allItems={allItems}
          isLoading={managedResourcesLoading}
          error={managedResourcesError}
          config={gitOpsConfig}
        />
      </BentoCard>

      {/* Right side: First small component (Velero config) */}
      <BentoCard size="small" gridColumn="9 / 11" gridRow="5 / 7">
        <ComponentCard
          enabled={!!mcp?.spec?.components?.kyverno}
          version={mcp?.spec?.components?.kyverno?.version}
          allItems={allItems}
          isLoading={managedResourcesLoading}
          error={managedResourcesError}
          config={veleroConfig}
        />
      </BentoCard>

      {/* Right side: Second small component (Vault) */}
      <BentoCard size="small" gridColumn="11 / 13" gridRow="5 / 7">
        <ComponentCard
          enabled={!!mcp?.spec?.components?.externalSecretsOperator}
          version={mcp?.spec?.components?.externalSecretsOperator?.version}
          allItems={allItems}
          isLoading={managedResourcesLoading}
          error={managedResourcesError}
          config={vaultConfig}
        />
      </BentoCard>
    </BentoGrid>
  );
};

export default HintsCardsRow;
