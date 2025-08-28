import { BusyIndicator, ObjectPage, ObjectPageSection, ObjectPageTitle, Panel, Title } from '@ui5/webcomponents-react';
import { useParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import styles from './McpPage.module.css';
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
import HintsCardsRow from '../../../components/HintsCardsRow/HintsCardsRow.tsx';

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
              className="cp-page-section-overview"
              id="overview"
              titleText={t('McpPage.overviewTitle')}
              hideTitleText
            >
              <HintsCardsRow mcp={mcp} />
            </ObjectPageSection>
           
          </ObjectPage>
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
