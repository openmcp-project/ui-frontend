import { BusyIndicator, Card, CardHeader, FlexBox, FlexBoxDirection } from '@ui5/webcomponents-react';
import { GenericHintCard } from './GenericHintCard/GenericHintCard';
import { useCrossplaneHintConfig, useGitOpsHintConfig, useVaultHintConfig } from './GenericHintCard/genericHintConfigs';

import { ControlPlaneType } from '../../lib/api/types/crate/controlPlanes';
import { ManagedResourcesRequest, ManagedResourcesResponse } from '../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../lib/shared/constants';
import { useApiResource } from '../../lib/api/useApiResource';
import { ManagedResourceItem } from '../../lib/shared/types';
import React, { useMemo } from 'react';
import { ComponentCard } from '../ComponentCard.tsx';

interface HintsProps {
  mcp: ControlPlaneType;
  navigate: (sectionId: string) => void;
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

const HintsCardsRow: React.FC<HintsProps> = ({ mcp, navigate }) => {
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
    <>
      {managedResourcesLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <BusyIndicator active />
        </div>
      ) : (
        <div
          style={{
            padding: '0.5rem',
            paddingBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <ComponentCard
            componentName="Crossplane"
            imgSrc="/crossplane-icon.png"
            subtitle="Compose cloud infrastructure"
            version="v1.4.24"
            installed={true}
            percentage={35}
            label="Healthy"
            onClick={() => navigate('crossplane')}
          />
          <ComponentCard
            componentName="Flux"
            imgSrc="/flux.png"
            subtitle="GitOps for Kubernetes automating continuous sync and delivery"
            version="v3.2.31"
            installed={true}
            percentage={68}
            label="Managed"
            onClick={() => navigate('flux')}
          />
          <ComponentCard
            componentName="Vault"
            imgSrc="/vault.png"
            subtitle="Security and secrets management"
            version="not installed"
            installed={false}
          />
          <ComponentCard
            componentName="Landscapers"
            imgSrc="/landscaper.svg"
            subtitle="Automate cross‑dependent Kubernetes deployments"
            version="v1.40.2"
            installed={true}
            percentage={97}
            label="Planted"
            onClick={() => navigate('landscapers')}
          />
          <ComponentCard
            componentName="Kyverno"
            imgSrc="/kyverno.svg"
            subtitle="Kubernetes-native policy as code for secure, compliant clusters"
            version="not installed"
            installed={false}
          />
          <ComponentCard
            componentName="External Secrets Operator"
            imgSrc="/eso_light.png"
            subtitle="Secrets sync from external providers with policy‑driven control"
            version="not installed"
            installed={false}
          />
        </div>
      )}
    </>
  );
};

export default HintsCardsRow;
