import {
  BusyIndicator,
  ObjectPage,
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

import { Kustomizations } from '../../../components/ControlPlane/Kustomizations.tsx';
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
import HintsCardsRow from '../../../components/HintsCardsRow/HintsCardsRow.tsx';

import { useState } from 'react';
import { EditManagedControlPlaneWizardDataLoader } from '../../../components/Wizards/CreateManagedControlPlane/EditManagedControlPlaneWizardDataLoader.tsx';
import { ControlPlanePageMenu } from '../../../components/ControlPlanes/ControlPlanePageMenu.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { GitRepositories } from '../../../components/ControlPlane/GitRepositories.tsx';

export type McpPageSectionId = 'overview' | 'crossplane' | 'flux' | 'landscapers';

export default function McpPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const { t } = useTranslation();
  const [isEditManagedControlPlaneWizardOpen, setIsEditManagedControlPlaneWizardOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<McpPageSectionId | undefined>('overview');
  const {
    data: mcp,
    error,
    isLoading,
  } = useApiResource(ControlPlaneResource(projectName, workspaceName, controlPlaneName));
  const displayName = mcp?.metadata?.annotations?.[DISPLAY_NAME_ANNOTATION];
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
          <ObjectPage
            mode="IconTabBar"
            titleArea={
              <ObjectPageTitle
                header={displayName ?? controlPlaneName}
                subHeader={t('Entities.ManagedControlPlane')}
                breadcrumbs={<BreadcrumbFeedbackHeader />}
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
                      projectName={projectName}
                      workspaceName={workspaceName ?? ''}
                      mcpName={controlPlaneName}
                    />
                    <YamlViewButtonWithLoader
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
                      setIsOpen={setIsEditManagedControlPlaneWizardOpen}
                      workspaceName={mcp?.status?.access?.namespace}
                      resourceName={controlPlaneName}
                      isOnMcpPage
                    />
                  </div>
                }
              />
            }
            selectedSectionId={selectedSectionId}
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
                <ComponentList mcp={mcp} />
              </ObjectPageSubSection>
            </ObjectPageSection>

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

            <ObjectPageSection id="landscapers" titleText={t('McpPage.landscapersTitle')} className={styles.section}>
              <Landscapers />
            </ObjectPageSection>
          </ObjectPage>
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
