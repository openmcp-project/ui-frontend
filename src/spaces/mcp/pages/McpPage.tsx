import '@ui5/webcomponents-fiori/dist/illustrations/SimpleBalloon';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import {
  BusyIndicator,
  FlexBox,
  ObjectPage,
  ObjectPageHeader,
  ObjectPageSection,
  ObjectPageSubSection,
  ObjectPageTitle,
} from '@ui5/webcomponents-react';
import { useParams, useSearchParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import styles from './McpPage.module.css';
// thorws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import { useTranslation } from 'react-i18next';
import ComponentList from '../../../components/ControlPlane/ComponentList.tsx';
import { ManagedResources } from '../../../components/ControlPlane/ManagedResources.tsx';
import { Providers } from '../../../components/ControlPlane/Providers.tsx';
import { ProvidersConfig } from '../../../components/ControlPlane/ProvidersConfig.tsx';
import { BreadcrumbFeedbackHeader } from '../../../components/Core/BreadcrumbFeedbackHeader.tsx';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { ControlPlane as ControlPlaneResource } from '../../../lib/api/types/crate/controlPlanes.ts';
import { McpContextProvider, WithinManagedControlPlane } from '../../../lib/shared/McpContext.tsx';

import { useApiResource } from '../../../lib/api/useApiResource.ts';

import { Landscapers } from '../../../components/ControlPlane/Landscapers.tsx';
import Graph from '../../../components/Graphs/Graph.tsx';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';

import { useMemo, useState, useCallback, useContext } from 'react';
import { GitRepositories } from '../../../components/ControlPlane/GitRepositories.tsx';
import { Kustomizations } from '../../../components/ControlPlane/Kustomizations.tsx';
import { McpConfigMaps } from '../../../components/ControlPlane/McpConfigMaps.tsx';
import { McpSecrets } from '../../../components/ControlPlane/McpSecrets.tsx';
import { McpStatusSection } from '../../../components/ControlPlane/McpStatusSection.tsx';
import { ControlPlanePageMenu } from '../../../components/ControlPlanes/ControlPlanePageMenu.tsx';
import { Center } from '../../../components/Ui/Center/Center.tsx';
import { DeprecatedLabel } from '../../../components/Ui/DeprecatedLabel/DeprecatedLabel.tsx';
import { WizardStepType } from '../../../components/Wizards/CreateManagedControlPlane/CreateManagedControlPlaneWizardContainer.tsx';
import { EditManagedControlPlaneWizardDataLoader } from '../../../components/Wizards/CreateManagedControlPlane/EditManagedControlPlaneWizardDataLoader.tsx';
import { useFeatureToggle } from '../../../context/FeatureToggleContext.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { ManagedControlPlaneAuthorization } from '../authorization/ManagedControlPlaneAuthorization.tsx';
import { ComponentsDashboard } from '../components/ComponentsDashboard/ComponentsDashboard.tsx';
import { McpHeader } from '../components/McpHeader/McpHeader.tsx';
import { useSplitter } from '../../../components/Splitter/SplitterContext.tsx';
import { YamlSidePanelWithLoader } from '../../../components/Yaml/YamlSidePanelWithLoader.tsx';
import { ApiConfigContext } from '../../../components/Shared/k8s';
import { ResourceHealthBar } from '../../../components/ControlPlane/ResourceHealthBar/ResourceHealthBar.tsx';

const MCP_PAGE_SECTIONS = ['overview', 'crossplane', 'flux', 'landscapers'] as const;
export type McpPageSectionId = (typeof MCP_PAGE_SECTIONS)[number];

export default function McpPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { openInAside } = useSplitter();
  const apiConfig = useContext(ApiConfigContext);
  const [isEditManagedControlPlaneWizardOpen, setIsEditManagedControlPlaneWizardOpen] = useState(false);
  const [editManagedControlPlaneWizardSection, setEditManagedControlPlaneWizardSection] = useState<
    undefined | WizardStepType
  >(undefined);
  const [providersCount, setProvidersCount] = useState(0);
  const [providerConfigsCount, setProviderConfigsCount] = useState(0);
  const [managedResourcesCount, setManagedResourcesCount] = useState(0);
  const [providersHealthStats, setProvidersHealthStats] = useState({ installed: 0, healthy: 0, total: 0 });
  const [managedResourcesHealthStats, setManagedResourcesHealthStats] = useState({
    ready: 0,
    synced: 0,
    total: 0,
  });
  const selectedSectionId = useMemo(() => {
    const tab = searchParams.get('tab');
    if (tab && MCP_PAGE_SECTIONS.includes(tab as McpPageSectionId)) {
      return tab as McpPageSectionId;
    }
    return 'overview' as McpPageSectionId;
  }, [searchParams]);

  const setTabFromSection = (sectionId: McpPageSectionId) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', sectionId);
      return newParams;
    });
  };

  const showBreadcrumbs = searchParams.get('showBreadcrumbs') !== 'false';

  const {
    data: mcp,
    error,
    isLoading,
  } = useApiResource(ControlPlaneResource(projectName, workspaceName, controlPlaneName));
  const { markMcpV1asDeprecated } = useFeatureToggle();
  const displayName =
    mcp?.metadata?.annotations && typeof mcp.metadata.annotations === 'object'
      ? (mcp.metadata.annotations as Record<string, string | undefined>)[DISPLAY_NAME_ANNOTATION]
      : undefined;
  const onEditComponents = () => {
    setEditManagedControlPlaneWizardSection('componentSelection');
    setIsEditManagedControlPlaneWizardOpen(true);
  };
  const handleEditManagedControlPlaneWizardClose = () => {
    setIsEditManagedControlPlaneWizardOpen(false);
    setEditManagedControlPlaneWizardSection(undefined);
  };

  const handleSectionChange = (e: { detail: { selectedSectionId: string } }) => {
    const newSectionId = e.detail.selectedSectionId as McpPageSectionId;
    setTabFromSection(newSectionId);
  };

  const handleYamlClick = useCallback(() => {
    if (!mcp || !controlPlaneName) return;

    const content = (
      <YamlSidePanelWithLoader
        isEdit={false}
        workspaceName={mcp?.status?.access?.namespace}
        resourceType={'managedcontrolplanes'}
        resourceName={controlPlaneName}
      />
    );
    openInAside(content);
  }, [mcp, controlPlaneName, openInAside]);

  if (isLoading) {
    return (
      <Center>
        <BusyIndicator active />
      </Center>
    );
  }

  if (!projectName || !workspaceName || !controlPlaneName || isNotFoundError(error)) {
    return <NotFoundBanner entityType={t('Entities.ManagedControlPlane')} />;
  }

  if (error || !mcp) {
    return (
      <Center>
        <IllustratedError details={error?.message} />
      </Center>
    );
  }

  const isComponentInstalledCrossplane = !!mcp?.spec?.components?.crossplane;
  const isComponentInstalledFlux = !!mcp?.spec?.components?.flux;
  const isComponentInstalledLandscaper = !!mcp?.spec?.components?.landscaper;

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
          <ManagedControlPlaneAuthorization>
            <ObjectPage
              mode="IconTabBar"
              headerPinned={true}
              preserveHeaderStateOnClick={true}
              hidePinButton={true}
              titleArea={
                <ObjectPageTitle
                  header={displayName ?? controlPlaneName}
                  subHeader={<span className={styles.resourceKind}>{t('Entities.ManagedControlPlane')}</span>}
                  breadcrumbs={showBreadcrumbs ? <BreadcrumbFeedbackHeader /> : undefined}
                  //TODO: actionBar should use Toolbar and ToolbarButton for consistent design
                  actionsBar={
                    <div className={styles.actionsBar}>
                      <McpStatusSection
                        mcpStatus={mcp?.status}
                        projectName={projectName}
                        workspaceName={workspaceName}
                        mcpName={controlPlaneName}
                      />
                      <CopyKubeconfigButton />
                      <ControlPlanePageMenu
                        setIsEditManagedControlPlaneWizardOpen={setIsEditManagedControlPlaneWizardOpen}
                        onYamlClick={handleYamlClick}
                      />
                      <EditManagedControlPlaneWizardDataLoader
                        isOpen={isEditManagedControlPlaneWizardOpen}
                        setIsOpen={handleEditManagedControlPlaneWizardClose}
                        workspaceName={mcp?.status?.access?.namespace}
                        resourceName={controlPlaneName}
                        initialSection={editManagedControlPlaneWizardSection}
                      />
                    </div>
                  }
                />
              }
              selectedSectionId={selectedSectionId}
              headerArea={
                <ObjectPageHeader className={styles.compactHeader}>
                  <FlexBox alignItems={'Baseline'} gap={'2.5rem'}>
                    <McpHeader mcp={mcp} project={projectName} workspace={workspaceName} />
                    {markMcpV1asDeprecated && (
                      <span className={styles.deprecatedWrapper}>
                        <DeprecatedLabel />
                      </span>
                    )}
                  </FlexBox>
                </ObjectPageHeader>
              }
              onSelectedSectionChange={handleSectionChange}
            >
              <ObjectPageSection id="overview" titleText={t('McpPage.overviewTitle')}>
                <ObjectPageSubSection id="dashboard" titleText={t('McpPage.dashboardTitle')} className={styles.section}>
                  <ComponentsDashboard
                    components={mcp.spec?.components}
                    onInstallButtonClick={onEditComponents}
                    onNavigateToMcpSection={(sectionId) => {
                      setTabFromSection(sectionId);
                    }}
                  />
                </ObjectPageSubSection>
                <ObjectPageSubSection id="graph" titleText={t('McpPage.graphTitle')} className={styles.section}>
                  <Graph />
                </ObjectPageSubSection>
                <ObjectPageSubSection
                  id="components"
                  titleText={t('McpPage.componentsTitle')}
                  className={styles.section}
                >
                  <ComponentList mcp={mcp} onEditClick={onEditComponents} />
                </ObjectPageSubSection>
                <ObjectPageSubSection
                  id="configmaps"
                  titleText={t('McpPage.configMapsTitle')}
                  className={styles.section}
                >
                  <McpConfigMaps />
                </ObjectPageSubSection>
                <ObjectPageSubSection id="secrets" titleText={t('McpPage.secretsTitle')} className={styles.section}>
                  <McpSecrets />
                </ObjectPageSubSection>
              </ObjectPageSection>

              {isComponentInstalledCrossplane && (
                <ObjectPageSection id="crossplane" titleText={t('McpPage.crossplaneTitle')}>
                  <ObjectPageSubSection
                    id="providers"
                    titleText={t('McpPage.providersTitle')}
                    className={styles.section}
                  >
                    <Providers />
                  </ObjectPageSubSection>
                  <ObjectPageSubSection
                    id="provider-configs"
                    titleText={t('McpPage.providerConfigsTitle')}
                    className={styles.section}
                  >
                    <ProvidersConfig />
                  </ObjectPageSubSection>
                  <ObjectPageSubSection
                    id="managed-resources"
                    titleText={t('McpPage.managedResourcesTitle')}
                    className={styles.section}
                  >
                    <ManagedResources />
                  </ObjectPageSubSection>
                </ObjectPageSection>
              )}

              {isComponentInstalledFlux && (
                <ObjectPageSection id="flux" titleText={t('McpPage.fluxTitle')}>
                  <ObjectPageSubSection
                    id="git-repositories"
                    titleText={t('McpPage.gitRepositoriesTitle')}
                    className={styles.section}
                  >
                    <GitRepositories />
                  </ObjectPageSubSection>
                  <ObjectPageSubSection
                    id="kustomizations"
                    titleText={t('McpPage.kustomizationsTitle')}
                    className={styles.section}
                  >
                    <Kustomizations />
                  </ObjectPageSubSection>
                </ObjectPageSection>
              )}

              {isComponentInstalledLandscaper && (
                <ObjectPageSection
                  id="landscapers"
                  titleText={t('McpPage.landscapersTitle')}
                  className={styles.section}
                >
                  <Landscapers />
                </ObjectPageSection>
              )}
            </ObjectPage>
          </ManagedControlPlaneAuthorization>
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
