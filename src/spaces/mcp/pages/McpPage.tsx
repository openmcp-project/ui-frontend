import { BusyIndicator, ObjectPage, ObjectPageSection, ObjectPageTitle } from '@ui5/webcomponents-react';
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
import { useApiResource } from '../../../lib/api/useApiResource.ts';

import { YamlViewButtonWithLoader } from '../../../components/Yaml/YamlViewButtonWithLoader.tsx';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { ManagedResourcesRequest } from '../../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../../lib/shared/constants';
import { useMemo } from 'react';
import { useMcpBentoLayout } from '../views/McpBentoLayout';
import { CrossplaneDetailsTable } from '../views/CrossplaneDetailsTable';
import { GitOpsDetailsTable } from '../views/GitOpsDetailsTable';
import { MembersDetailsTable } from '../views/MembersDetailsTable';


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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Flatten managed resources
  const allItems = useMemo(() => {
    if (!managedResources || !Array.isArray(managedResources)) return [];
    return managedResources
      .filter((managedResource) => managedResource?.items)
      .flatMap((managedResource) => managedResource.items || []);
  }, [managedResources]);

  // Prepare member items from role bindings
  const memberItems = useMemo(
    () => (mcp?.spec?.authorization?.roleBindings || []).map((rb: any) => ({ role: rb.role })),
    [mcp?.spec?.authorization?.roleBindings]
  );

  // Use the Bento layout hook which manages expansion state internally
  const { expandedCard, bentoGrid } = useMcpBentoLayout({
    mcp,
    allItems,
    memberItems,
    isLoading: managedResourcesLoading,
    error: managedResourcesError,
  });

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
          {/* Unified Bento Layout - Graph stays persistent */}
          {bentoGrid}

          {/* Render details tables based on expanded state */}
          {expandedCard === 'crossplane' && <CrossplaneDetailsTable />}
          {expandedCard === 'gitops' && <GitOpsDetailsTable />}
          {expandedCard === 'members' && <MembersDetailsTable mcp={mcp} />}
        </div>
      </ObjectPageSection>
    </ObjectPage>
  );
}
