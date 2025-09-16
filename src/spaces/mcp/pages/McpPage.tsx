import { BusyIndicator, ObjectPage, ObjectPageSection, ObjectPageTitle, Panel } from '@ui5/webcomponents-react';
import { useParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import styles from './McpPage.module.css';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleBalloon';
// thorws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { BreadCrumbFeedbackHeader } from '../../../components/Core/IntelligentBreadcrumbs.tsx';

import { ControlPlane as ControlPlaneResource } from '../../../lib/api/types/crate/controlPlanes.ts';
import { useTranslation } from 'react-i18next';
import { McpContextProvider, WithinManagedControlPlane } from '../../../lib/shared/McpContext.tsx';
import MCPHealthPopoverButton from '../../../components/ControlPlane/MCPHealthPopoverButton.tsx';
import { useApiResource, useProvidersConfigResource } from '../../../lib/api/useApiResource.ts';

import { YamlViewButtonWithLoader } from '../../../components/Yaml/YamlViewButtonWithLoader.tsx';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { BentoGrid, BentoCard, GraphCard, ComponentCard } from '../../../components/BentoGrid';
import { useCrossplaneHintConfig, useGitOpsHintConfig, useESOHintConfig, useKyvernoHintConfig, useMembersHintConfig } from '../../../components/BentoGrid/ComponentCard/componentConfigs.ts';
import { ManagedResourcesRequest, ManagedResourcesResponse } from '../../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../../lib/shared/constants';
import { ManagedResourceItem } from '../../../lib/shared/types';
import { useMemo, useState } from 'react';
import { ManagedResources } from '../../../components/ControlPlane/ManagedResources.tsx';
import { Providers } from '../../../components/ControlPlane/Providers.tsx';
import { ProvidersConfig } from '../../../components/ControlPlane/ProvidersConfig.tsx';
import FluxList from '../../../components/ControlPlane/FluxList.tsx';
import { MemberTable } from '../../../components/Members/MemberTable.tsx';
import { resolveProviderType, generateColorMap } from '../../../components/Graphs/graphUtils';

// Utility function to flatten managed resources
const flattenManagedResources = (managedResources: ManagedResourcesResponse): ManagedResourceItem[] => {
  if (!managedResources || !Array.isArray(managedResources)) return [];

  return managedResources
    .filter((managedResource) => managedResource?.items)
    .flatMap((managedResource) => managedResource.items || []);
};

// Utility function to calculate provider distribution with graph colors
const calculateProviderDistribution = (items: ManagedResourceItem[], providerConfigs: any[]) => {
  if (!items || items.length === 0) return { segments: [], totalProviders: 0 };

  // Count resources by provider type (same method as graph)
  const providerCounts: Record<string, number> = {};
  
  items.forEach(item => {
    const providerConfigName = item?.spec?.providerConfigRef?.name ?? 'unknown';
    const providerType = resolveProviderType(providerConfigName, providerConfigs);
    providerCounts[providerType] = (providerCounts[providerType] || 0) + 1;
  });

  // Create NodeData-like objects for color generation (reuse graph's color logic)
  const nodeDataForColors = Object.keys(providerCounts).map(providerType => ({
    providerType,
    providerConfigName: '', // Not needed for color generation
    fluxName: undefined
  }));

  // Generate colors using the same logic as the graph
  const colorMap = generateColorMap(nodeDataForColors as any, 'source');

  // Convert to segments with percentages and counts
  const total = items.length;
  const segments = Object.entries(providerCounts)
    .map(([provider, count]) => ({
      percentage: Math.round((count / total) * 100),
      color: colorMap[provider] || '#BFBFBF', // fallback color
      label: provider.replace('provider-', '').toUpperCase(),
      count: count
    }))
    .filter(segment => segment.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  return {
    segments,
    totalProviders: segments.length
  };
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  // Add managed resources API call within the MCP context
  const {
    data: managedResources,
    isLoading: managedResourcesLoading,
    error: managedResourcesError,
  } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval,
  });

  // Fetch provider configs for distribution calculation
  const { data: providerConfigsList } = useProvidersConfigResource({
    refreshInterval: 60000,
  });

  // Flatten all managed resources once and pass to components
  const allItems = useMemo(
    () => flattenManagedResources(managedResources ?? ([] as unknown as ManagedResourcesResponse)),
    [managedResources],
  );

  // Calculate provider distribution for crossplane card
  const providerDistribution = useMemo(
    () => calculateProviderDistribution(allItems, providerConfigsList || []),
    [allItems, providerConfigsList],
  );

  // Get hint configurations
  const crossplaneConfig = useCrossplaneHintConfig();
  const gitOpsConfig = useGitOpsHintConfig();
  const membersConfig = useMembersHintConfig();
  const esoConfig = useESOHintConfig();
  const kyvernoConfig = useKyvernoHintConfig();

  // Handle component card clicks
  const handleCrossplaneExpand = () => {
    setIsExpanding(true);
    setTimeout(() => {
      setExpandedCard('crossplane');
      setIsExpanding(false);
    }, 50);
  };

  const handleGitOpsExpand = () => {
    setIsExpanding(true);
    setTimeout(() => {
      setExpandedCard('gitops');
      setIsExpanding(false);
    }, 50);
  };

  const handleMembersExpand = () => {
    setIsExpanding(true);
    setTimeout(() => {
      setExpandedCard('members');
      setIsExpanding(false);
    }, 50);
  };

  const handleCollapseExpanded = () => {
    setIsExpanding(true);
    setTimeout(() => {
      setExpandedCard(null);
      setIsExpanding(false);
    }, 300);
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
            <div className={styles.actionsBar}>
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
        <div className={styles.mainContainer}>
          <BentoGrid className={expandedCard === 'members' ? styles.expandedMembersGrid : expandedCard ? styles.expandedGrid : ''}>
            {/* Left side: Crossplane component in large (top) - expands to full width when expanded */}
            {(!expandedCard || expandedCard === 'crossplane') && (
              <BentoCard 
                size="large" 
                gridColumn={expandedCard === 'crossplane' ? "1 / 13" : "1 / 9"} 
                gridRow="1 / 3"
                className={expandedCard === 'crossplane' ? styles.expandedCard : ''}
              >
                <div className={styles.cardContentContainer}>
                  <ComponentCard
                    enabled={!!mcp?.spec?.components?.crossplane}
                    version={mcp?.spec?.components?.crossplane?.version}
                    allItems={allItems}
                    isLoading={managedResourcesLoading}
                    error={managedResourcesError}
                    config={crossplaneConfig}
                    onClick={expandedCard === 'crossplane' ? handleCollapseExpanded : handleCrossplaneExpand}
                    size="large"
                    secondarySegments={providerDistribution.segments}
                    secondaryLabel={`Providers ${providerDistribution.totalProviders}`}
                    expanded={expandedCard === 'crossplane'} 
                  />
                </div>
              </BentoCard>
            )}

            {/* GitOps component - shows when expanded*/}
            {expandedCard === 'gitops' && (
              <BentoCard 
                size="large" 
                gridColumn="1 / 13" 
                gridRow="1 / 3"
                className={styles.expandedCard}
              >
                <div className={styles.cardContentContainer}>
                  <ComponentCard
                    enabled={true}
                    version={mcp?.spec?.components?.flux?.version}
                    allItems={allItems}
                    isLoading={managedResourcesLoading}
                    error={managedResourcesError}
                    config={gitOpsConfig}
                    onClick={handleCollapseExpanded}
                    size="large"
                    expanded={true}
                  />
                </div>
              </BentoCard>
            )}

            {/* Members component - shows when expanded */}
            {expandedCard === 'members' && (
              <BentoCard 
                size="large" 
                gridColumn="1 / 13" 
                gridRow="1 / 7"
                className={styles.expandedCard}
              >
                <div className={styles.cardContentContainer}>
                  <ComponentCard
                    enabled={!!mcp?.spec?.components?.apiServer}
                    version={''}
                    allItems={mcp?.spec?.authorization?.roleBindings || []}
                    isLoading={managedResourcesLoading}
                    error={managedResourcesError}
                    config={membersConfig}
                    onClick={handleCollapseExpanded}
                    size="large"
                    expanded={true}
                  />
                </div>
              </BentoCard>
            )}

            {/* Left side: Graph in extra-large (bottom) - expands to full width when any component is expanded, but hidden for members */}
            {expandedCard !== 'members' && (
              <BentoCard 
                size="extra-large" 
                gridColumn={expandedCard ? "1 / 13" : "1 / 9"} 
                gridRow="3 / 7"
                className={expandedCard ? styles.expandedCardNonInteractive : styles.nonInteractiveCard}
              >
                <GraphCard 
                  title="Resource Dependencies" 
                  colorBy={expandedCard === 'gitops' ? 'flux' : 'source'}
                />
              </BentoCard>
            )}

            {/* Right side cards - hide when any component is expanded */}
            {!expandedCard && (
              <>
                {/* Right side: First medium component (GitOps) - ACTIVATED */}
                <BentoCard 
                  size="medium" 
                  gridColumn="9 / 13" 
                  gridRow="1 / 3"
                  className={isExpanding ? styles.hidingCard : ''}
                >
                  <ComponentCard
                    enabled={!!mcp?.spec?.components?.flux}
                    version={mcp?.spec?.components?.flux?.version}
                    allItems={allItems}
                    isLoading={managedResourcesLoading}
                    error={managedResourcesError}
                    config={gitOpsConfig}
                    onClick={handleGitOpsExpand}
                    size="medium"
                  />
                </BentoCard>

                {/* Right side: Second medium component (Members) */}
                <BentoCard 
                  size="medium" 
                  gridColumn="9 / 13" 
                  gridRow="3 / 5"
                  className={isExpanding ? styles.hidingCard : ''}
                >
                  <ComponentCard
                    enabled={!!mcp?.spec?.components?.apiServer}
                    version={''}
                    allItems={mcp?.spec?.authorization?.roleBindings || []}
                    isLoading={managedResourcesLoading}
                    error={managedResourcesError}
                    config={membersConfig}
                    onClick={handleMembersExpand}
                    size="medium"
                  />
                </BentoCard>

                {/* Right side: First small component (Kyverno config) */}
                <BentoCard 
                  size="small" 
                  gridColumn="9 / 11" 
                  gridRow="5 / 7"
                  className={isExpanding ? styles.hidingCard : styles.disabledCard}
                >
                  <ComponentCard
                    enabled={false}
                    version={mcp?.spec?.components?.kyverno?.version}
                    allItems={allItems}
                    isLoading={managedResourcesLoading}
                    error={managedResourcesError}
                    config={kyvernoConfig}
                    size="small"
                  />
                </BentoCard>

                {/* Right side: Second small component (ESO) */}
                <BentoCard 
                  size="small" 
                  gridColumn="11 / 13" 
                  gridRow="5 / 7"
                  className={isExpanding ? styles.hidingCard : styles.disabledCard}
                >
                  <ComponentCard
                    enabled={false}
                    version={mcp?.spec?.components?.externalSecretsOperator?.version}
                    allItems={allItems}
                    isLoading={managedResourcesLoading}
                    error={managedResourcesError}
                    config={esoConfig}
                    size="small"
                  />
                </BentoCard>
              </>
            )}
          </BentoGrid>

          {/* Tables section - outside the BentoGrid to maintain the 600px layout */}
          {expandedCard === 'crossplane' && (
            <div className={styles.tableSection}>
              <Panel headerText="Details">
                <div className={styles.crossplaneTableElementFirst}>
                  <div className="crossplane-table-element">
                    <Providers />
                  </div>
                  <div className={`crossplane-table-element ${styles.crossplaneTableElement}`}>
                    <ProvidersConfig />
                  </div>
                  <div className={`crossplane-table-element ${styles.crossplaneTableElement}`}>
                    <ManagedResources />
                  </div>
                </div>
              </Panel>
              <div className={styles.detailsPanelBottom}></div>
            </div>
          )}
          
          {expandedCard === 'gitops' && (
            <div className={styles.tableSection}>
              <Panel headerText="Flux List">
                <FluxList />
              </Panel>
              <div className={styles.detailsPanelBottom}></div>
            </div>
          )}

          {expandedCard === 'members' && (
            <div className={styles.tableSection}>
              <Panel headerText="Members List">
                <MemberTable 
                  members={
                    mcp?.spec?.authorization?.roleBindings?.map((binding: any) => ({
                      name: (binding.subjects?.[0]?.name || 'Unknown').replace(/^openmcp:/, ''),
                      kind: binding.subjects?.[0]?.kind || 'Unknown',
                      roles: binding.role || [],
                      namespace: binding.namespace || '',
                    })) || []
                  }
                  requireAtLeastOneMember={false}
                />
              </Panel>
              <div className={styles.detailsPanelBottom}></div>
            </div>
          )}
        </div>
      </ObjectPageSection>
    </ObjectPage>
  );
}
