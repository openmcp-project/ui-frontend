import { BusyIndicator, ObjectPage, ObjectPageSection, ObjectPageTitle, Panel, Title } from '@ui5/webcomponents-react';
import { useParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleBalloon';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
// thorws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';
import IntelligentBreadcrumbs from '../../../components/Core/IntelligentBreadcrumbs.tsx';

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
          <ObjectPage
            preserveHeaderStateOnClick={true}
            titleArea={
              <ObjectPageTitle
                header={controlPlaneName}
                breadcrumbs={<IntelligentBreadcrumbs />}
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
                  </div>
                }
              />
            }
          >
            <ObjectPageSection
              className="cp-page-section-graph"
              id="graph"
              titleText={t('ControlPlaneView.graphTitle')}
              hideTitleText
            >
              <Graph />
            </ObjectPageSection>
            <ObjectPageSection
              className="cp-page-section-components"
              id="components"
              titleText={t('McpPage.componentsTitle')}
              hideTitleText
            >
              <Panel
                headerLevel="H2"
                headerText="Panel"
                header={<Title level="H3">{t('McpPage.componentsTitle')}</Title>}
                noAnimation
              >
                <ComponentList mcp={mcp} />
              </Panel>
            </ObjectPageSection>
            <ObjectPageSection
              className="cp-page-section-crossplane"
              id="crossplane"
              titleText={t('McpPage.crossplaneTitle')}
              hideTitleText
            >
              <Panel
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
              className="cp-page-section-landscapers"
              id="landscapers"
              titleText={t('McpPage.landscapersTitle')}
              hideTitleText
            >
              <Panel
                headerLevel="H3"
                headerText="Panel"
                header={<Title level="H3">{t('McpPage.landscapersTitle')}</Title>}
                noAnimation
              >
                <Landscapers />
              </Panel>
            </ObjectPageSection>
            <ObjectPageSection
              className="cp-page-section-gitops"
              id="gitops"
              titleText={t('McpPage.gitOpsTitle')}
              hideTitleText
            >
              <Panel
                headerLevel="H3"
                headerText="Panel"
                header={<Title level="H3">{t('McpPage.gitOpsTitle')}</Title>}
                noAnimation
              >
                <FluxList />
              </Panel>
            </ObjectPageSection>
          </ObjectPage>
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
