import {
  Bar,
  BusyIndicator,
  DynamicSideContent,
  FlexBox,
  Label,
  Link,
  ObjectPage,
  ObjectPageHeader,
  ObjectPageSection,
  ObjectPageSubSection,
  ObjectPageTitle,
  Panel,
  PanelDomRef,
  SegmentedButton,
  SegmentedButtonItem,
  SplitterElement,
  SplitterLayout,
  Title,
  ToolbarButton,
} from '@ui5/webcomponents-react';
import { useParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import styles from './McpPage.module.css';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleBalloon';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
// thorws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { BreadCrumbFeedbackHeader } from '../../../components/Core/IntelligentBreadcrumbs.tsx';

import FluxList from '../../../components/ControlPlane/FluxList.tsx';
import { ControlPlane as ControlPlaneResource } from '../../../lib/api/types/crate/controlPlanes.ts';
import { useTranslation } from 'react-i18next';
import { McpContextProvider, WithinManagedControlPlane } from '../../../lib/shared/McpContext.tsx';
import { ManagedResources } from '../../../components/ControlPlane/ManagedResources.tsx';
import { ProvidersConfig } from '../../../components/ControlPlane/ProvidersConfig.tsx';
import { Providers } from '../../../components/ControlPlane/Providers.tsx';
import ComponentList from '../../../components/ControlPlane/ComponentList.tsx';
import MCPHealthPopoverButton from '../../../components/ControlPlane/MCPHealthPopoverButton.tsx';
import { useApiResource } from '../../../lib/api/useApiResource.ts';

import { YamlViewButtonWithLoader } from '../../../components/Yaml/YamlViewButtonWithLoader.tsx';
import { Landscapers } from '../../../components/ControlPlane/Landscapers.tsx';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import Graph from '../../../components/Graphs/Graph.tsx';
import HintsCardsRow, { flattenManagedResources } from '../../../components/HintsCardsRow/HintsCardsRow.tsx';
import GitRepositories from '../../../components/ControlPlane/GitRepositories.tsx';
import Kustomizations from '../../../components/ControlPlane/Kustomizations.tsx';
import { MySplitterLayout, SplitterProvider } from './SplitterContext.tsx';
import MCPHealthPopoverButtonWithSplitter from '../../../components/ControlPlane/MCPHealthPopoverButtonWithSplitter.tsx';
import React, { useMemo, useRef, useState } from 'react';
import { GenericHintCard } from '../../../components/HintsCardsRow/GenericHintCard/GenericHintCard.tsx';
import { ManagedResourcesResponse } from '../../../lib/api/types/crossplane/listManagedResources.ts';
import { GitOpsHints } from '../../../components/ControlPlane/GitOpsHints.tsx';

export default function McpPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const { t } = useTranslation();
  const [isGraphCollapsed, setIsGraphCollapsed] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  const [selectedSubSectionId, setSelectedSubSectionId] = useState<string | undefined>();

  const [isHeaderToggled, setIsHeaderToggled] = useState(true);

  const [componentsView, setComponentsView] = useState('grid');

  const scrollIntoViewRef = useRef(null);
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

  const handleNavigateToKustomization = (kustomization: string) => {
    console.log(kustomization);
    setSelectedSubSectionId('gitops2');
    // TODO: Highligth Table row
  };

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
          <ObjectPage
            selectedSectionId={selectedSectionId}
            selectedSubSectionId={selectedSubSectionId}
            mode="IconTabBar"
            preserveHeaderStateOnClick={true}
            titleArea={
              <ObjectPageTitle
                header={
                  <Title level="H2" size="H2">
                    {controlPlaneName}
                  </Title>
                }
                subHeader="Managed Control Plane"
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
                    {
                      <MCPHealthPopoverButtonWithSplitter
                        mcpStatus={mcp?.status}
                        projectName={projectName}
                        workspaceName={workspaceName ?? ''}
                        mcpName={controlPlaneName}
                      />
                    }
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
            headerArea={
              <ObjectPageHeader>
                <FlexBox alignItems="Center" wrap="Wrap">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: '4px 16px',
                      alignItems: 'center',
                      fontSize: '14px',
                    }}
                  >
                    <Label>Display name</Label>
                    <div>Display name (fake)</div>

                    <Label>Created on</Label>
                    <div>17 September 2025 (x days ago)</div>

                    <Label>Created by</Label>
                    <div>name.name@domain.com</div>
                  </div>
                </FlexBox>
              </ObjectPageHeader>
            }
            onToggleHeaderArea={(e) => setIsHeaderToggled(e)}
            onSelectedSectionChange={(x) => {
              setSelectedSectionId(undefined);
              setSelectedSubSectionId(undefined);
            }}
          >
            <ObjectPageSection id="overview" titleText={'Components'} style={{ paddingTop: '1rem' }}>
              <FlexBox direction="Column" gap="1rem">
                <Panel
                  fixed
                  header={
                    <FlexBox
                      style={{ width: '100%', margin: '1rem 0.5rem 0.5rem 0.5rem' }}
                      justifyContent="SpaceBetween"
                    >
                      <Title>{componentsView === 'grid' ? 'Dashboard' : `Resources (4)`}</Title>
                      <SegmentedButton
                        onSelectionChange={(e) => {
                          setComponentsView(e.detail.selectedItems[0].dataset.id);
                        }}
                      >
                        <SegmentedButtonItem data-id="grid" selected={componentsView === 'grid'} icon="sap-icon://grid">
                          Dashboard
                        </SegmentedButtonItem>
                        <SegmentedButtonItem
                          data-id="table"
                          selected={componentsView === 'table'}
                          icon="sap-icon://table-view"
                        >
                          Table View
                        </SegmentedButtonItem>
                      </SegmentedButton>
                    </FlexBox>
                  }
                >
                  {componentsView === 'grid' ? (
                    <HintsCardsRow mcp={mcp} navigate={(sectionId) => setSelectedSectionId(sectionId)} />
                  ) : (
                    <ComponentList mcp={mcp} />
                  )}
                </Panel>

                <Panel
                  noAnimation={true}
                  headerText="Graph (persist expansion state in local storage?)"
                  collapsed={isGraphCollapsed}
                  onToggle={() => setIsGraphCollapsed((val) => !val)}
                >
                  <Graph />
                </Panel>
              </FlexBox>
            </ObjectPageSection>
            <ObjectPageSection id="crossplane" titleText={t('McpPage.crossplaneTitle')} style={{ paddingTop: '1rem' }}>
              <Panel
                noAnimation={true}
                collapsed={isGraphCollapsed}
                headerText="Graph (persist expansion state in local storage?)"
                onToggle={() => setIsGraphCollapsed((val) => !val)}
              >
                <Graph />
              </Panel>

              <ObjectPageSubSection id="crossplane1" titleText="Providers" style={{ marginTop: '1.5rem' }}>
                <Providers />
              </ObjectPageSubSection>
              <ObjectPageSubSection id="crossplane2" titleText="Provider Configs" style={{ marginTop: '1.5rem' }}>
                <ProvidersConfig />
              </ObjectPageSubSection>
              <ObjectPageSubSection id="crossplane3" titleText="Managed Resources" style={{ marginTop: '1.5rem' }}>
                <ManagedResources onNavigateToKustomization={handleNavigateToKustomization} />
              </ObjectPageSubSection>
            </ObjectPageSection>
            <ObjectPageSection id="flux" titleText={t('McpPage.gitOpsTitle')} style={{ paddingTop: '1rem' }}>
              <GitOpsHints isLoading={isLoading} />

              <Panel
                noAnimation={true}
                collapsed={isGraphCollapsed}
                headerText="Graph (persist expansion state in local storage?)"
                onToggle={() => setIsGraphCollapsed((val) => !val)}
              >
                <Graph />
              </Panel>

              <ObjectPageSubSection id="gitops1" titleText="GitRepositories" style={{ marginTop: '1.5rem' }}>
                <GitRepositories scrollIntoViewRef={scrollIntoViewRef} />
              </ObjectPageSubSection>
              <ObjectPageSubSection id="gitops2" titleText="Kustomizations" style={{ marginTop: '1.5rem' }}>
                <Kustomizations onNavigateToGitRepository={(todo) => scrollIntoViewRef.current?.scrollTo(todo)} />
              </ObjectPageSubSection>
            </ObjectPageSection>
            <ObjectPageSection
              id="landscapers"
              titleText={t('McpPage.landscapersTitle')}
              style={{ paddingTop: '1rem' }}
            >
              <Landscapers />
            </ObjectPageSection>
          </ObjectPage>
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
