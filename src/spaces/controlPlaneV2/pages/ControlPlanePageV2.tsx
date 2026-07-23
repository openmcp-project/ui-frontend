import '@ui5/webcomponents-fiori/dist/illustrations/SimpleBalloon';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import {
  BusyIndicator,
  FlexBox,
  MessageStrip,
  ObjectPage,
  ObjectPageHeader,
  ObjectPageSection,
  ObjectPageSubSection,
  ObjectPageTitle,
} from '@ui5/webcomponents-react';
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CopyKubeconfigButton from '../../../components/ControlPlanes/CopyKubeconfigButton.tsx';
import styles from './ControlPlanePageV2.module.css';
// throws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import { useTranslation } from 'react-i18next';
import { BreadcrumbFeedbackHeader } from '../../../components/Core/BreadcrumbFeedbackHeader.tsx';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';

import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { YamlViewButton } from '../../../components/Yaml/YamlViewButton.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { McpStatusSection } from '../../../components/ControlPlane/McpStatusSection.tsx';

import { McpMembersAvatarView } from '../../../components/ControlPlanes/McpMembersAvatarView/McpMembersAvatarView.tsx';
import { Center } from '../../../components/Ui/Center/Center.tsx';
import { ControlPlanePageMenu } from '../../../components/ControlPlanes/ControlPlanePageMenu.tsx';
import { WizardStepType } from '../../../components/Wizards/CreateControlPlaneV2/CreateControlPlaneV2WizardContainer.tsx';
import { EditControlPlaneV2WizardDataLoader } from '../../../components/Wizards/CreateControlPlaneV2/EditControlPlaneV2WizardDataLoader.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { McpContextProvider, WithinManagedControlPlane, useMcp } from '../../../lib/shared/McpContext.tsx';
import { useControlPlaneV2Query } from '../../onboarding/hooks/controlPlaneV2/useControlPlaneV2Query.ts';

import { GitRepositories } from '../../../components/ControlPlane/GitRepositories.tsx';
import { Kustomizations } from '../../../components/ControlPlane/Kustomizations.tsx';
import { Landscapers } from '../../../components/ControlPlane/Landscapers.tsx';
import { ManagedResources } from '../../../components/ControlPlane/ManagedResources.tsx';
import { McpConfigMaps } from '../../../components/ControlPlane/McpConfigMaps.tsx';
import { McpSecrets } from '../../../components/ControlPlane/McpSecrets.tsx';
import { Providers } from '../../../components/ControlPlane/Providers.tsx';
import { ProvidersConfig } from '../../../components/ControlPlane/ProvidersConfig.tsx';
import Graph from '../../../components/Graphs/Graph.tsx';
import { AuthProviderMcp } from '../../mcp/auth/AuthContextMcp.tsx';
import { ManagedControlPlaneAuthorization } from '../../mcp/authorization/ManagedControlPlaneAuthorization.tsx';
import { ComponentsDashboardV2 } from '../../mcp/components/ComponentsDashboard/ComponentsDashboardV2.tsx';
import { useCrossplaneQuery } from '../components/Kpi/useCrossplaneQuery.ts';
import { useEsoQuery } from '../components/Kpi/useEsoQuery.ts';
import { useFluxQuery } from '../components/Kpi/useFluxQuery.ts';
import { useLandscaperQuery } from '../components/Kpi/useLandscaperQuery.ts';
import { McpHeader } from '../../mcp/components/McpHeader/McpHeader.tsx';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { IllustratedBanner } from '../../../components/Ui/IllustratedBanner/IllustratedBanner.tsx';
import { useFrontendConfig } from '../../../context/FrontendConfigContext.tsx';
import { useViewMode } from '../../../context/ViewModeContext.tsx';
import { useShellBarMcpActions } from '../../../context/ShellBarMcpActionsContext.tsx';
import { registerKubeconfigWithBff } from '../../mcp/pages/headlampKubeconfig.ts';
import { Routes } from '../../../Routes.ts';
import { CrossplaneInstallDialog } from '../../mcp/components/CrossplaneInstallDialog/CrossplaneInstallDialog.tsx';
import { ComponentInstallDialog } from '../../mcp/components/ComponentInstallDialog/ComponentInstallDialog.tsx';
import { useCreateFlux } from '../../mcp/hooks/useCreateFlux.ts';
import { useUpdateFlux } from '../../mcp/hooks/useUpdateFlux.ts';
import { useCreateEso } from '../../mcp/hooks/useCreateEso.ts';
import { useUpdateEso } from '../../mcp/hooks/useUpdateEso.ts';
import { useCreateLandscaper } from '../../mcp/hooks/useCreateLandscaper.ts';
import { useUpdateLandscaper } from '../../mcp/hooks/useUpdateLandscaper.ts';

type InstallTarget = 'crossplane' | 'flux' | 'eso' | 'landscaper' | null;

function OpenSourceHeadlamp({
  projectName,
  workspaceName,
  controlPlaneName,
}: {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
}) {
  const mcp = useMcp();
  const { setMcpActions, clearMcpActions } = useShellBarMcpActions();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { documentationBaseUrl } = useFrontendConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const clusterAlias = `${mcp.project}--${mcp.workspace}--${mcp.name}`;
  const baseSrcPrefix = `/api/headlamp/c/${encodeURIComponent(clusterAlias)}`;

  const rawInitialPath = searchParams.get('headlampPath') ?? '';
  const sanitisedInitialPath = rawInitialPath.startsWith(baseSrcPrefix)
    ? rawInitialPath.slice(baseSrcPrefix.length) || '/'
    : rawInitialPath;

  const backPath = generatePath(Routes.Project, { projectName });
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [headlampPath, setHeadlampPath] = useState<string>(sanitisedInitialPath);
  const isUnsupportedPath = headlampPath.includes('/settings') || headlampPath.includes('/plugins');
  const [installTarget, setInstallTarget] = useState<InstallTarget>(null);
  const mcpName = mcp.name;
  const mcpNamespace = `project-${mcp.project}--ws-${mcp.workspace}`;

  useEffect(() => {
    setMcpActions({
      kubeconfig: mcp.kubeconfig,
      mcpName: mcp.name,
      roleBindings: mcp.roleBindings,
      project: projectName,
      workspace: workspaceName,
      navigateBack: () => navigate(backPath),
    });
    return () => {
      clearMcpActions();
    };
  }, [
    mcp.kubeconfig,
    mcp.name,
    mcp.roleBindings,
    projectName,
    workspaceName,
    backPath,
    navigate,
    setMcpActions,
    clearMcpActions,
  ]);

  useEffect(() => {
    if (!mcp.kubeconfig) return;
    const controller = new AbortController();
    const baseSrc = `/api/headlamp/c/${encodeURIComponent(clusterAlias)}`;
    registerKubeconfigWithBff(mcp.kubeconfig, clusterAlias, controller.signal)
      .then(() => {
        if (!controller.signal.aborted)
          setIframeSrc(sanitisedInitialPath ? `${baseSrc}${sanitisedInitialPath}` : baseSrc);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(true);
        else if (err instanceof Error && err.name !== 'AbortError') setError(true);
      });
    return () => {
      controller.abort();
      setIframeSrc(null);
      setError(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcp.kubeconfig, clusterAlias]);

  useEffect(() => {
    if (!iframeSrc) return;
    const intervalId = setInterval(() => {
      try {
        const fullPathname = iframeRef.current?.contentWindow?.location?.pathname ?? '';
        if (!fullPathname) return;
        const internalPath = fullPathname.startsWith(baseSrcPrefix)
          ? fullPathname.slice(baseSrcPrefix.length) || '/'
          : fullPathname;
        if (internalPath !== headlampPath) {
          setHeadlampPath(internalPath);
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set('headlampPath', internalPath);
              return next;
            },
            { replace: true },
          );
        }
      } catch {
        // cross-origin access blocked — ignore
      }
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [iframeSrc, headlampPath, baseSrcPrefix, setSearchParams]);

  // The embedded Headlamp plugin cannot install a component itself; it posts a
  // message asking us to open the matching V2 install dialog. Validate origin +
  // source + action, then map the component name to the dialog to open.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.source !== 'ocp-headlamp-plugin' || data.action !== 'openInstallWizard') return;
      const map: Record<string, InstallTarget> = {
        crossplane: 'crossplane',
        flux: 'flux',
        externalSecretsOperator: 'eso',
        landscaper: 'landscaper',
      };
      const target = map[data.component as string];
      if (target) setInstallTarget(target);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Install dialogs are always mounted (visibility driven by `open`) so they
  // survive the loading/error early returns below.
  const installDialogs = (
    <>
      <CrossplaneInstallDialog
        open={installTarget === 'crossplane'}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        mode="install"
        onClose={() => setInstallTarget(null)}
      />
      <ComponentInstallDialog
        open={installTarget === 'flux'}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        componentName="Flux"
        serviceName="flux"
        mode="install"
        useCreateMutation={useCreateFlux}
        useUpdateMutation={useUpdateFlux}
        onClose={() => setInstallTarget(null)}
      />
      <ComponentInstallDialog
        open={installTarget === 'eso'}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        componentName="External Secrets Operator"
        serviceName="external-secrets-operator"
        mode="install"
        useCreateMutation={useCreateEso}
        useUpdateMutation={useUpdateEso}
        onClose={() => setInstallTarget(null)}
      />
      <ComponentInstallDialog
        open={installTarget === 'landscaper'}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        componentName="Landscaper"
        serviceName="landscaper"
        mode="install"
        useCreateMutation={useCreateLandscaper}
        useUpdateMutation={useUpdateLandscaper}
        onClose={() => setInstallTarget(null)}
      />
    </>
  );

  let body: ReactNode;
  if (error) {
    body = (
      <IllustratedBanner
        illustrationName={IllustrationMessageType.SimpleError}
        title={t('McpPage.headlampUnavailableTitle')}
        subtitle={t('McpPage.headlampUnavailableSubtitle')}
        help={{ link: `${documentationBaseUrl}/docs/help`, buttonText: t('McpPage.headlampGetSupport') }}
      />
    );
  } else if (!iframeSrc) {
    body = null;
  } else {
    body = (
      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 3rem)' }}>
        {isUnsupportedPath && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '0.5rem' }}>
            <MessageStrip design="Information" hideCloseButton>
              {t('McpPage.headlampUnsupportedPlugin')}
            </MessageStrip>
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={iframeSrc}
          src={iframeSrc}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          title={`${t('McpPage.headlampTitle')} — ${projectName}/${workspaceName}/${controlPlaneName}`}
        />
      </div>
    );
  }

  return (
    <>
      {body}
      {installDialogs}
    </>
  );
}

function LegacyModeShellBarSync({ controlPlaneName }: { controlPlaneName: string }) {
  const { setMcpActions, clearMcpActions } = useShellBarMcpActions();
  useEffect(() => {
    setMcpActions({ mcpName: controlPlaneName });
    return () => {
      clearMcpActions();
    };
  }, [controlPlaneName, setMcpActions, clearMcpActions]);
  return null;
}

const MCP_PAGE_SECTIONS = ['overview', 'crossplane', 'flux', 'landscaper'] as const;
export type McpPageSectionId = (typeof MCP_PAGE_SECTIONS)[number];

export default function ControlPlanePageV2() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const namespace = projectName && workspaceName ? `project-${projectName}--ws-${workspaceName}` : undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { mode } = useViewMode();
  const [isEditManagedControlPlaneWizardOpen, setIsEditManagedControlPlaneWizardOpen] = useState(false);
  const [editManagedControlPlaneWizardSection, setEditManagedControlPlaneWizardSection] = useState<
    undefined | WizardStepType
  >(undefined);
  const selectedSectionId = useMemo(() => {
    const tab = searchParams.get('tab');
    if (tab && MCP_PAGE_SECTIONS.includes(tab as McpPageSectionId)) {
      return tab as McpPageSectionId;
    }
    return 'overview' as McpPageSectionId;
  }, [searchParams]);
  const { data: mcp, isPending: isLoading, error } = useControlPlaneV2Query(controlPlaneName, namespace);
  const { crossplaneData, isLoading: isLoadingCrossplane } = useCrossplaneQuery(controlPlaneName, namespace);
  const { fluxData, isLoading: isLoadingFlux } = useFluxQuery(controlPlaneName, namespace);
  const { landscaperData, isLoading: isLoadingLandscaper } = useLandscaperQuery(controlPlaneName, namespace);
  const { esoData, isLoading: isLoadingEso } = useEsoQuery(controlPlaneName, namespace);
  const cardsReady = !isLoadingCrossplane && !isLoadingFlux && !isLoadingLandscaper && !isLoadingEso;
  // Hold graph mount until the cards' 0.3s height transition (index.css) has
  // settled — otherwise the graph layout fights with concurrent card animations.
  const [graphReady, setGraphReady] = useState(false);
  useEffect(() => {
    if (!cardsReady) return;
    const id = setTimeout(() => setGraphReady(true), 400);
    return () => clearTimeout(id);
  }, [cardsReady]);
  const setTabFromSection = (sectionId: McpPageSectionId) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', sectionId);
      return newParams;
    });
  };

  const showBreadcrumbs = searchParams.get('showBreadcrumbs') !== 'false';

  const displayName =
    mcp?.metadata?.annotations && typeof mcp.metadata.annotations === 'object'
      ? (mcp.metadata.annotations as Record<string, string | undefined>)[DISPLAY_NAME_ANNOTATION]
      : undefined;

  const roleBindings = useMemo(
    () =>
      mcp?.spec?.iam?.oidc?.defaultProvider?.roleBindings
        ?.filter((roleBinding) => roleBinding !== null)
        .map((roleBinding) => ({
          role: roleBinding.roleRefs?.find((roleRef) => roleRef !== null)?.name ?? '',
          subjects: (roleBinding.subjects ?? [])
            .filter((subject) => subject !== null)
            .map((subject) => ({ kind: subject.kind ?? '', name: subject.name ?? '' })),
        })),
    [mcp?.spec?.iam?.oidc?.defaultProvider?.roleBindings],
  );

  const handleEditManagedControlPlaneWizardClose = () => {
    setIsEditManagedControlPlaneWizardOpen(false);
    setEditManagedControlPlaneWizardSection(undefined);
  };

  const handleSectionChange = (e: { detail: { selectedSectionId: string } }) => {
    const newSectionId = e.detail.selectedSectionId as McpPageSectionId;
    setTabFromSection(newSectionId);
  };
  if (isLoading) {
    return (
      <Center>
        <BusyIndicator active />
      </Center>
    );
  }

  if (!projectName || !workspaceName || !controlPlaneName || isNotFoundError(error) || (!isLoading && !mcp)) {
    return <NotFoundBanner entityType={t('Entities.ManagedControlPlane')} />;
  }

  if (error || !mcp) {
    return (
      <Center>
        <IllustratedError details={error?.message} />
      </Center>
    );
  }

  const isComponentInstalledCrossplane = !!crossplaneData?.isInstalled;
  const isComponentInstalledFlux = !!fluxData?.isInstalled;
  const isComponentInstalledLandscaper = !!landscaperData?.isInstalled;

  if (mode === 'open-source') {
    return (
      <McpContextProvider
        context={{
          project: projectName,
          workspace: workspaceName,
          name: controlPlaneName,
        }}
        isV2
      >
        <AuthProviderMcp>
          <WithinManagedControlPlane>
            <ManagedControlPlaneAuthorization>
              <OpenSourceHeadlamp
                key={`${projectName}/${workspaceName}/${controlPlaneName}`}
                projectName={projectName}
                workspaceName={workspaceName}
                controlPlaneName={controlPlaneName}
              />
            </ManagedControlPlaneAuthorization>
          </WithinManagedControlPlane>
        </AuthProviderMcp>
      </McpContextProvider>
    );
  }

  return (
    <McpContextProvider
      context={{
        project: projectName,
        workspace: workspaceName,
        name: controlPlaneName,
      }}
      isV2
    >
      <AuthProviderMcp>
        <WithinManagedControlPlane>
          <ManagedControlPlaneAuthorization>
            <LegacyModeShellBarSync controlPlaneName={controlPlaneName} />
            <ObjectPage
              mode="IconTabBar"
              titleArea={
                <ObjectPageTitle
                  header={displayName ?? controlPlaneName}
                  subHeader={t('Entities.ManagedControlPlane')}
                  breadcrumbs={showBreadcrumbs ? <BreadcrumbFeedbackHeader /> : undefined}
                  //TODO: actionBar should use Toolbar and ToolbarButton for consistent design
                  actionsBar={
                    <div className={styles.actionsBar}>
                      <YamlViewButton
                        variant="loader"
                        workspaceName={mcp?.metadata?.namespace}
                        resourceType={'controlplanes'}
                        resourceName={controlPlaneName}
                        withoutApiConfig
                      />
                      <CopyKubeconfigButton />
                      <ControlPlanePageMenu
                        setIsEditManagedControlPlaneWizardOpen={setIsEditManagedControlPlaneWizardOpen}
                      />
                      <EditControlPlaneV2WizardDataLoader
                        isOpen={isEditManagedControlPlaneWizardOpen}
                        setIsOpen={handleEditManagedControlPlaneWizardClose}
                        namespace={namespace}
                        resourceName={controlPlaneName}
                        initialSection={editManagedControlPlaneWizardSection}
                      />
                    </div>
                  }
                />
              }
              selectedSectionId={selectedSectionId}
              headerArea={
                <ObjectPageHeader>
                  <FlexBox alignItems={'Baseline'} gap={'2.5rem'}>
                    <McpHeader mcp={mcp} />
                    <McpStatusSection
                      mcpStatus={mcp?.status}
                      projectName={projectName}
                      workspaceName={workspaceName}
                      mcpName={controlPlaneName}
                    />
                    <McpMembersAvatarView roleBindings={roleBindings} project={projectName} workspace={workspaceName} />
                  </FlexBox>
                </ObjectPageHeader>
              }
              onSelectedSectionChange={handleSectionChange}
            >
              <ObjectPageSection id="overview" titleText={t('McpPage.overviewTitle')}>
                <ObjectPageSubSection id="dashboard" titleText={t('McpPage.dashboardTitle')} className={styles.section}>
                  <ComponentsDashboardV2
                    crossplaneData={crossplaneData}
                    fluxData={fluxData}
                    landscaperData={landscaperData}
                    esoData={esoData}
                    mcpName={controlPlaneName ?? ''}
                    mcpNamespace={namespace ?? ''}
                    onNavigateToMcpSection={setTabFromSection}
                  />
                </ObjectPageSubSection>
                <ObjectPageSubSection id="graph" titleText={t('McpPage.graphTitle')} className={styles.section}>
                  {graphReady && <Graph />}
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
                <ObjectPageSection id="landscaper" titleText={t('McpPage.landscaperTitle')} className={styles.section}>
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
