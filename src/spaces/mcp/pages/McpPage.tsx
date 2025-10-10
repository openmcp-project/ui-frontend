import {
  BusyIndicator,
  ObjectPage,
  ObjectPageHeader,
  ObjectPageSection,
  ObjectPageSubSection,
  ObjectPageTitle,
} from '@ui5/webcomponents-react';
import { useParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import styles from './McpPage.module.css';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleBalloon';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
// thorws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import { BreadcrumbFeedbackHeader } from '../../../components/Core/BreadcrumbFeedbackHeader.tsx';
import { ControlPlane as ControlPlaneResource } from '../../../lib/api/types/crate/controlPlanes.ts';
import { useTranslation } from 'react-i18next';
import { McpContextProvider, WithinManagedControlPlane } from '../../../lib/shared/McpContext.tsx';
import { ManagedResources } from '../../../components/ControlPlane/ManagedResources.tsx';
import { ProvidersConfig } from '../../../components/ControlPlane/ProvidersConfig.tsx';
import { Providers } from '../../../components/ControlPlane/Providers.tsx';
import ComponentList from '../../../components/ControlPlane/ComponentList.tsx';
import MCPHealthPopoverButton from '../../../components/ControlPlane/MCPHealthPopoverButton.tsx';
import { useApiResource } from '../../../lib/api/useApiResource.ts';

import { YamlViewButton } from '../../../components/Yaml/YamlViewButton.tsx';
import { Landscapers } from '../../../components/ControlPlane/Landscapers.tsx';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import Graph from '../../../components/Graphs/Graph.tsx';
import HintsCardsRow from '../../../components/HintsCardsRow/HintsCardsRow.tsx';

import { useState } from 'react';
import { EditManagedControlPlaneWizardDataLoader } from '../../../components/Wizards/CreateManagedControlPlane/EditManagedControlPlaneWizardDataLoader.tsx';
import { ControlPlanePageMenu } from '../../../components/ControlPlanes/ControlPlanePageMenu.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { WizardStepType } from '../../../components/Wizards/CreateManagedControlPlane/CreateManagedControlPlaneWizardContainer.tsx';
import { GitRepositories } from '../../../components/ControlPlane/GitRepositories.tsx';
import { Kustomizations } from '../../../components/ControlPlane/Kustomizations.tsx';
import { McpHeader } from '../components/McpHeader.tsx';

export type McpPageSectionId = 'overview' | 'crossplane' | 'flux' | 'landscapers';

export default function McpPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const { t } = useTranslation();
  const [isEditManagedControlPlaneWizardOpen, setIsEditManagedControlPlaneWizardOpen] = useState(false);
  const [editManagedControlPlaneWizardSection, setEditManagedControlPlaneWizardSection] = useState<
    undefined | WizardStepType
  >(undefined);
  const [selectedSectionId, setSelectedSectionId] = useState<McpPageSectionId | undefined>('overview');
  const {
    data: mcp,
    error,
    isLoading,
  } = useApiResource(ControlPlaneResource(projectName, workspaceName, controlPlaneName));
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
  if (isLoading) {
    return <BusyIndicator active />;
  }

  if (!projectName || !workspaceName || !controlPlaneName || isNotFoundError(error)) {
    return <NotFoundBanner entityType={t('Entities.ManagedControlPlane')} />;
  }

  if (error || !mcp) {
    return <IllustratedError details={error?.message} />;
  }

  const isComponentInstalledCrossplane = !!mcp.spec?.components.crossplane;
  const isComponentInstalledFlux = !!mcp.spec?.components.flux;
  const isComponentInstalledLandscaper = !!mcp.spec?.components.landscaper;

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
            mode="IconTabBar"
            titleArea={
              <ObjectPageTitle
                header={displayName ?? controlPlaneName}
                subHeader={t('Entities.ManagedControlPlane')}
                breadcrumbs={<BreadcrumbFeedbackHeader />}
                //TODO: actionBar should use Toolbar and ToolbarButton for consistent design
                actionsBar={
                  <div className={styles.actionsBar}>
                    <MCPHealthPopoverButton
                      mcpStatus={mcp?.status}
                      projectName={projectName}
                      workspaceName={workspaceName ?? ''}
                      mcpName={controlPlaneName}
                    />
                    <YamlViewButton
                      variant="loader"
                      workspaceName={mcp?.status?.access?.namespace}
                      resourceType={'managedcontrolplanes'}
                      resourceName={controlPlaneName}
                    />
                    <CopyKubeconfigButton />
                    <ControlPlanePageMenu
                      setIsEditManagedControlPlaneWizardOpen={setIsEditManagedControlPlaneWizardOpen}
                    />
                    <EditManagedControlPlaneWizardDataLoader
                      isOpen={isEditManagedControlPlaneWizardOpen}
                      setIsOpen={handleEditManagedControlPlaneWizardClose}
                      workspaceName={mcp?.status?.access?.namespace}
                      resourceName={controlPlaneName}
                      isOnMcpPage
                      initialSection={editManagedControlPlaneWizardSection}
                    />
                  </div>
                }
              />
            }
            selectedSectionId={selectedSectionId}
            headerArea={
              <ObjectPageHeader>
                <McpHeader mcp={mcp} />
              </ObjectPageHeader>
            }
            onSelectedSectionChange={() => setSelectedSectionId(undefined)}
          >
            <ObjectPageSection id="overview" titleText={t('McpPage.overviewTitle')}>
              <ObjectPageSubSection
                id="dashboard"
                titleText={t('McpPage.dashboardTitle')}
                hideTitleText
                className={styles.section}
              >
                <HintsCardsRow mcp={mcp} onNavigateToMcpSection={(sectionId) => setSelectedSectionId(sectionId)} />
              </ObjectPageSubSection>
              <ObjectPageSubSection id="graph" titleText={t('McpPage.graphTitle')} className={styles.section}>
                <Graph />
              </ObjectPageSubSection>
              <ObjectPageSubSection id="components" titleText={t('McpPage.componentsTitle')} className={styles.section}>
                <ComponentList mcp={mcp} onEditClick={onEditComponents} />
              </ObjectPageSubSection>
            </ObjectPageSection>

            {isComponentInstalledCrossplane && (
              <ObjectPageSection id="crossplane" titleText={t('McpPage.crossplaneTitle')}>
                <ObjectPageSubSection id="providers" titleText={t('McpPage.providersTitle')} className={styles.section}>
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
              <ObjectPageSection id="landscapers" titleText={t('McpPage.landscapersTitle')} className={styles.section}>
                <Landscapers />
              </ObjectPageSection>
            )}
          </ObjectPage>
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
