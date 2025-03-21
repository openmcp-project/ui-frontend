import {
  ObjectPage,
  ObjectPageSection,
  ObjectPageTitle,
  Panel,
  Title,
} from '@ui5/webcomponents-react';
import { useParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleBalloon';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
// thorws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import IllustratedError from '../../components/Shared/IllustratedError.tsx';
import IntelligentBreadcrumbs from '../../components/Core/IntelligentBreadcrumbs.tsx';
import {
  McpContextProvider,
  WithinManagedControlPlane,
} from '../../lib/shared/McpContext.tsx';
import ProvidersList from '../../components/ControlPlane/ProvidersList.tsx';
import FluxList from '../../components/ControlPlane/FluxList.tsx';
import { ControlPlane as ControlPlaneResource } from '../../lib/api/types/crate/controlPlanes.ts';
import useResource from '../../lib/api/useApiResource.ts';
import MCPHealthPopoverButton from '../../components/ControlPlane/MCPHealthPopoverButton.tsx';
import ComponentList from '../../components/ControlPlane/ComponentList.tsx';
import { useTranslation } from 'react-i18next';

export default function ControlPlaneView() {
  const { projectName, workspaceName, controlPlaneName, contextName } =
    useParams();
  const { t } = useTranslation();

  const { data: mcp, error } = useResource(
    ControlPlaneResource(
      projectName ?? '',
      workspaceName ?? '',
      controlPlaneName ?? '',
    ),
  );

  if (!projectName || !workspaceName || !controlPlaneName) {
    return <></>;
  }

  if (error) {
    return <IllustratedError error={error} />;
  }
  if (
    !mcp?.status?.access?.key ||
    !mcp?.status?.access?.name ||
    !mcp?.status?.access?.namespace
  ) {
    return <IllustratedError error={t('ControlPlaneView.accessError')} />;
  }

  return (
    <McpContextProvider
      context={{
        project: projectName,
        workspace: workspaceName,
        name: controlPlaneName,
        context: contextName!,
      }}
    >
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
                  }}
                >
                  <MCPHealthPopoverButton mcpStatus={mcp.status} />
                  <CopyKubeconfigButton />
                </div>
              }
            />
          }
        >
          <ObjectPageSection
            className="cp-page-section-components"
            id="components"
            titleText="Components"
            hideTitleText
          >
            <Panel
              headerLevel="H2"
              headerText="Panel"
              header={<Title level="H3">Components</Title>}
              noAnimation
            >
              <ComponentList mcp={mcp} />
            </Panel>
          </ObjectPageSection>
          <ObjectPageSection
            className="cp-page-section-crossplane"
            id="crossplane"
            titleText="Crossplane"
            hideTitleText
          >
            <Panel
              className="cp-panel-crossplane"
              headerLevel="H3"
              headerText="Panel"
              header={<Title level="H3">Crossplane</Title>}
              noAnimation
            >
              <ProvidersList />
            </Panel>
          </ObjectPageSection>
          <ObjectPageSection
            className="cp-page-section-gitops"
            id="gitops"
            titleText="GitOps"
            hideTitleText
          >
            <Panel
              className="cp-panel-gitops"
              headerLevel="H3"
              headerText="Panel"
              header={<Title level="H3">GitOps</Title>}
              noAnimation
            >
              <FluxList />
            </Panel>
          </ObjectPageSection>
        </ObjectPage>
      </WithinManagedControlPlane>
    </McpContextProvider>
  );
}
