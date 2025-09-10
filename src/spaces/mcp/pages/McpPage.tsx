import { BusyIndicator, ObjectPage, ObjectPageSection, ObjectPageTitle, Panel, Title, Button } from '@ui5/webcomponents-react';
import { useParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import styles from './McpPage.module.css';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleBalloon';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
// thorws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { BreadCrumbFeedbackHeader } from '../../../components/Core/IntelligentBreadcrumbs.tsx';

import { ControlPlane as ControlPlaneResource } from '../../../lib/api/types/crate/controlPlanes.ts';
import { useTranslation } from 'react-i18next';
import { McpContextProvider, WithinManagedControlPlane } from '../../../lib/shared/McpContext.tsx';
import MCPHealthPopoverButton from '../../../components/ControlPlane/MCPHealthPopoverButton.tsx';
import { useApiResource } from '../../../lib/api/useApiResource.ts';

import { YamlViewButtonWithLoader } from '../../../components/Yaml/YamlViewButtonWithLoader.tsx';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { BentoGrid, BentoCard, GraphCard, ComponentCard } from '../../../components/BentoGrid';
import { useCrossplaneHintConfig, useGitOpsHintConfig, useVaultHintConfig, useVeleroHintConfig } from '../../../components/BentoGrid/ComponentCard/componentConfigs.ts';
import { ManagedResourcesRequest, ManagedResourcesResponse } from '../../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../../lib/shared/constants';
import { ManagedResourceItem } from '../../../lib/shared/types';
import { useMemo } from 'react';
import { ManagedResources } from '../../../components/ControlPlane/ManagedResources.tsx';
import { Providers } from '../../../components/ControlPlane/Providers.tsx';
import { ProvidersConfig } from '../../../components/ControlPlane/ProvidersConfig.tsx';
import FluxList from '../../../components/ControlPlane/FluxList.tsx';

// Utility function to flatten managed resources
const flattenManagedResources = (managedResources: ManagedResourcesResponse): ManagedResourceItem[] => {
  if (!managedResources || !Array.isArray(managedResources)) return [];

  return managedResources
    .filter((managedResource) => managedResource?.items)
    .flatMap((managedResource) => managedResource.items || []);
};

export default function McpPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const { t } = useTranslation();

  const {
    data: mcp,
    error,
    isLoading,
  } = useApiResource(ControlPlaneResource(projectName, workspaceName, controlPlaneName));

  if (isLoading) {
    return <BusyIndicator active />;
  }

  if (!projectName || !workspaceName || !controlPlaneName || isNotFoundError(error)) {
    return <NotFoundBanner entityType={t('Entities.ManagedControlPlane')} />;
  }

  if (error || !mcp) {
    return <IllustratedError details={error?.message} />;
  }

  return (
    <McpContextProvider
      context={{
        project: projectName,
        workspace: workspaceName,
        name: controlPlaneName,
      }}
    >
      <AuthProviderMcp>
        <WithinManagedControlPlane>
          <McpPageContent mcp={mcp} controlPlaneName={controlPlaneName} />
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}

function McpPageContent({ mcp, controlPlaneName }: { mcp: any; controlPlaneName: string }) {
  const { t } = useTranslation();
  const { projectName, workspaceName } = useParams();

  // Add managed resources API call within the MCP context
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

  // Handle component card clicks
  const handleCrossplaneClick = () => {
    const el = document.querySelector('#crossplane');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFluxClick = () => {
    const el = document.querySelector('#gitops');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // For now, small cards will also scroll to their respective sections
  const handleKyvernoClick = () => {
    const el = document.querySelector('#crossplane');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleVaultClick = () => {
    const el = document.querySelector('#crossplane');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <ObjectPage
      preserveHeaderStateOnClick={true}
      titleArea={
        <ObjectPageTitle
          header={controlPlaneName}
          breadcrumbs={<BreadCrumbFeedbackHeader />}
          //TODO: actionBar should use Toolbar and ToolbarButton for consistent design
          actionsBar={
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <MCPHealthPopoverButton
                mcpStatus={mcp?.status}
                projectName={projectName!}
                workspaceName={workspaceName ?? ''}
                mcpName={controlPlaneName}
              />
              <YamlViewButtonWithLoader
                workspaceName={mcp?.status?.access?.namespace}
                resourceType={'managedcontrolplanes'}
                resourceName={controlPlaneName}
              />
              <CopyKubeconfigButton />
            </div>
          }
        />
      }
    >
      <ObjectPageSection
        className="cp-page-section-overview"
        id="overview"
        titleText={t('McpPage.overviewTitle')}
        hideTitleText
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', paddingTop: '16px', paddingBottom: '12px' }}>
          <BentoGrid>
            {/* Left side: Graph in extra-large (top) */}
            <BentoCard size="extra-large" gridColumn="1 / 9" gridRow="1 / 5">
              <GraphCard title="Resource Dependencies" />
            </BentoCard>

            {/* Left side: Crossplane component in large (bottom) */}
            <BentoCard size="large" gridColumn="1 / 9" gridRow="5 / 7">
              <div 
                onClick={handleCrossplaneClick} 
                style={{ 
                  cursor: 'pointer', 
                  height: '100%', 
                  width: '100%',
                  position: 'relative'
                }}
              >
                <ComponentCard
                  enabled={!!mcp?.spec?.components?.crossplane}
                  version={mcp?.spec?.components?.crossplane?.version}
                  allItems={allItems}
                  isLoading={managedResourcesLoading}
                  error={managedResourcesError}
                  config={crossplaneConfig}
                />
                <Button
                  icon="sap-icon://expand"
                  design="Transparent"
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    minWidth: '32px',
                    height: '32px',
                    zIndex: 10
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCrossplaneClick();
                  }}
                />
              </div>
            </BentoCard>

            {/* Right side: First medium component (GitOps) */}
            <BentoCard size="medium" gridColumn="9 / 13" gridRow="1 / 3">
              <div 
                onClick={handleFluxClick} 
                style={{ 
                  cursor: 'pointer', 
                  height: '100%', 
                  width: '100%',
                  position: 'relative'
                }}
              >
                <ComponentCard
                  enabled={!!mcp?.spec?.components?.flux}
                  version={mcp?.spec?.components?.flux?.version}
                  allItems={allItems}
                  isLoading={managedResourcesLoading}
                  error={managedResourcesError}
                  config={gitOpsConfig}
                />
                <Button
                  icon="sap-icon://expand"
                  design="Transparent"
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    minWidth: '32px',
                    height: '32px',
                    zIndex: 10
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFluxClick();
                  }}
                />
              </div>
            </BentoCard>

            {/* Right side: Second medium component (GitOps copy) */}
            <BentoCard size="medium" gridColumn="9 / 13" gridRow="3 / 5">
              <div 
                onClick={handleFluxClick} 
                style={{ 
                  cursor: 'pointer', 
                  height: '100%', 
                  width: '100%',
                  position: 'relative'
                }}
              >
                <ComponentCard
                  enabled={!!mcp?.spec?.components?.flux}
                  version={mcp?.spec?.components?.flux?.version}
                  allItems={allItems}
                  isLoading={managedResourcesLoading}
                  error={managedResourcesError}
                  config={gitOpsConfig}
                />
                <Button
                  icon="sap-icon://expand"
                  design="Transparent"
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    minWidth: '32px',
                    height: '32px',
                    zIndex: 10
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFluxClick();
                  }}
                />
              </div>
            </BentoCard>

            {/* Right side: First small component (Velero config) */}
            <BentoCard size="small" gridColumn="9 / 11" gridRow="5 / 7">
              <div 
                onClick={handleKyvernoClick} 
                style={{ 
                  cursor: 'pointer', 
                  height: '100%', 
                  width: '100%',
                  position: 'relative'
                }}
              >
                <ComponentCard
                  enabled={!!mcp?.spec?.components?.kyverno}
                  version={mcp?.spec?.components?.kyverno?.version}
                  allItems={allItems}
                  isLoading={managedResourcesLoading}
                  error={managedResourcesError}
                  config={veleroConfig}
                />
                <Button
                  icon="sap-icon://expand"
                  design="Transparent"
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    minWidth: '24px',
                    height: '24px',
                    zIndex: 10
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleKyvernoClick();
                  }}
                />
              </div>
            </BentoCard>

            {/* Right side: Second small component (Vault) */}
            <BentoCard size="small" gridColumn="11 / 13" gridRow="5 / 7">
              <div 
                onClick={handleVaultClick} 
                style={{ 
                  cursor: 'pointer', 
                  height: '100%', 
                  width: '100%',
                  position: 'relative'
                }}
              >
                <ComponentCard
                  enabled={!!mcp?.spec?.components?.externalSecretsOperator}
                  version={mcp?.spec?.components?.externalSecretsOperator?.version}
                  allItems={allItems}
                  isLoading={managedResourcesLoading}
                  error={managedResourcesError}
                  config={vaultConfig}
                />
                <Button
                  icon="sap-icon://expand"
                  design="Transparent"
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    minWidth: '24px',
                    height: '24px',
                    zIndex: 10
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVaultClick();
                  }}
                />
              </div>
            </BentoCard>
          </BentoGrid>
        </div>
      </ObjectPageSection>
      
      <ObjectPageSection
        className="cp-page-section-crossplane"
        id="crossplane"
        titleText={t('McpPage.crossplaneTitle')}
        hideTitleText
      >
        <Panel
          className={styles.panel}
          headerLevel="H3"
          headerText="Panel"
          header={<Title level="H3">{t('McpPage.crossplaneTitle')}</Title>}
          noAnimation
        >
          <div className="crossplane-table-element">
            <Providers />
          </div>
          <div className="crossplane-table-element">
            <ProvidersConfig />
          </div>
          <div className="crossplane-table-element">
            <ManagedResources />
          </div>
        </Panel>
      </ObjectPageSection>
      
      <ObjectPageSection
        className="cp-page-section-gitops"
        id="gitops"
        titleText={t('McpPage.gitOpsTitle')}
        hideTitleText
      >
        <Panel
          className={styles.panel}
          headerLevel="H3"
          headerText="Panel"
          header={<Title level="H3">{t('McpPage.gitOpsTitle')}</Title>}
          noAnimation
        >
          <FluxList />
        </Panel>
      </ObjectPageSection>
    </ObjectPage>
  );
}
