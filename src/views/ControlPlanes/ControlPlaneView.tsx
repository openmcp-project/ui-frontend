import { ObjectPage, ObjectPageSection, ObjectPageTitle, Panel, Title } from '@ui5/webcomponents-react';
import { useParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleBalloon';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
// thorws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import IllustratedError from '../../components/Shared/IllustratedError.tsx';
import IntelligentBreadcrumbs from '../../components/Core/IntelligentBreadcrumbs.tsx';

import FluxList from '../../components/ControlPlane/FluxList.tsx';
import { ControlPlane as ControlPlaneResource } from '../../lib/api/types/crate/controlPlanes.ts';
import { useTranslation } from 'react-i18next';
import { McpContextProvider, WithinManagedControlPlane } from '../../lib/shared/McpContext.tsx';
import { ManagedResources } from '../../components/ControlPlane/ManagedResources.tsx';
import { ProvidersConfig } from '../../components/ControlPlane/ProvidersConfig.tsx';
import { Providers } from '../../components/ControlPlane/Providers.tsx';
import ComponentList from '../../components/ControlPlane/ComponentList.tsx';
import MCPHealthPopoverButton from '../../components/ControlPlane/MCPHealthPopoverButton.tsx';
import { useApiResource } from '../../lib/api/useApiResource';

import { YamlViewButtonWithLoader } from '../../components/Yaml/YamlViewButtonWithLoader.tsx';
import { Landscapers } from '../../components/ControlPlane/Landscapers.tsx';
import { AuthProviderMcp } from '../../spaces/mcp/auth/AuthContextMcp.tsx';

export default function ControlPlaneView() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const { t } = useTranslation();

  const { data: mcp, error } = useApiResource(
    ControlPlaneResource(projectName ?? '', workspaceName ?? '', controlPlaneName ?? ''),
  );

  if (!projectName || !workspaceName || !controlPlaneName) {
    return <></>;
  }

  if (error) {
    return <IllustratedError details={error.message} />;
  }
  if (!mcp?.status?.access?.key || !mcp?.status?.access?.name || !mcp?.status?.access?.namespace) {
    return <IllustratedError details={t('ControlPlaneView.accessError')} />;
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
              className="cp-page-section-components"
              id="components"
              titleText={t('ControlPlaneView.componentsTitle')}
              hideTitleText
            >
              <Panel
                headerLevel="H2"
                headerText="Panel"
                header={<Title level="H3">{t('ControlPlaneView.componentsTitle')}</Title>}
                noAnimation
              >
                <ComponentList mcp={mcp} />
              </Panel>
            </ObjectPageSection>
            <ObjectPageSection
              className="cp-page-section-crossplane"
              id="crossplane"
              titleText={t('ControlPlaneView.crossplaneTitle')}
              hideTitleText
            >
              <Panel
                headerLevel="H3"
                headerText="Panel"
                header={<Title level="H3">{t('ControlPlaneView.crossplaneTitle')}</Title>}
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
              titleText={t('ControlPlaneView.landscapersTitle')}
              hideTitleText
            >
              <Panel
                headerLevel="H3"
                headerText="Panel"
                header={<Title level="H3">{t('ControlPlaneView.landscapersTitle')}</Title>}
                noAnimation
              >
                <Landscapers />
              </Panel>
            </ObjectPageSection>
            <ObjectPageSection
              className="cp-page-section-gitops"
              id="gitops"
              titleText={t('ControlPlaneView.gitOpsTitle')}
              hideTitleText
            >
              <Panel
                headerLevel="H3"
                headerText="Panel"
                header={<Title level="H3">{t('ControlPlaneView.gitOpsTitle')}</Title>}
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
