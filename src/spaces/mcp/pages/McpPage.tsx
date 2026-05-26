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
import { McpContextProvider, WithinManagedControlPlane, useMcp } from '../../../lib/shared/McpContext.tsx';

import { useApiResource } from '../../../lib/api/useApiResource.ts';

import { Landscapers } from '../../../components/ControlPlane/Landscapers.tsx';
import Graph from '../../../components/Graphs/Graph.tsx';
import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { YamlViewButton } from '../../../components/Yaml/YamlViewButton.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';

import { useEffect, useMemo, useRef, useState } from 'react';
import { registerKubeconfigWithBff } from './headlampKubeconfig.ts';
import { GitRepositories } from '../../../components/ControlPlane/GitRepositories.tsx';
import { Kustomizations } from '../../../components/ControlPlane/Kustomizations.tsx';
import { McpConfigMaps } from '../../../components/ControlPlane/McpConfigMaps.tsx';
import { McpSecrets } from '../../../components/ControlPlane/McpSecrets.tsx';
import { McpStatusSection } from '../../../components/ControlPlane/McpStatusSection.tsx';
import { ControlPlanePageMenu } from '../../../components/ControlPlanes/ControlPlanePageMenu.tsx';
import { McpMembersAvatarView } from '../../../components/ControlPlanes/McpMembersAvatarView/McpMembersAvatarView.tsx';
import { Center } from '../../../components/Ui/Center/Center.tsx';
import { DeprecatedLabel } from '../../../components/Ui/DeprecatedLabel/DeprecatedLabel.tsx';
import { WizardStepType } from '../../../components/Wizards/CreateManagedControlPlane/CreateManagedControlPlaneWizardContainer.tsx';
import { EditManagedControlPlaneWizardDataLoader } from '../../../components/Wizards/CreateManagedControlPlane/EditManagedControlPlaneWizardDataLoader.tsx';
import { useFeatureToggle } from '../../../context/FeatureToggleContext.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { ManagedControlPlaneAuthorization } from '../authorization/ManagedControlPlaneAuthorization.tsx';
import { ComponentsDashboard } from '../components/ComponentsDashboard/ComponentsDashboard.tsx';
import { McpHeader } from '../components/McpHeader/McpHeader.tsx';

import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { IllustratedBanner } from '../../../components/Ui/IllustratedBanner/IllustratedBanner.tsx';
import { useFrontendConfig } from '../../../context/FrontendConfigContext.tsx';
import { useViewMode } from '../../../context/ViewModeContext.tsx';
import { useShellBarMcpActions } from '../../../context/ShellBarMcpActionsContext.tsx';
import { Routes } from '../../../Routes.ts';

// Open-source (Headlamp) mode — full-viewport iframe with ShellBar integration.
// Only rendered when mode === 'open-source'. The legacy ObjectPage is rendered otherwise,
// unchanged from main — no ShellBar context pollution.
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

  // Sanitise any stale full-BFF path that may have been persisted in the URL param.
  // Also strip a spurious leading "/api" segment that older versions of the path-sync
  // polling code accidentally saved (e.g. "/api/flux/overview" → "/flux/overview").
  const rawInitialPath = searchParams.get('headlampPath') ?? '';
  const strippedPath = rawInitialPath.startsWith(baseSrcPrefix)
    ? rawInitialPath.slice(baseSrcPrefix.length) || '/'
    : rawInitialPath;
  const sanitisedInitialPath =
    strippedPath.startsWith('/api/') && !strippedPath.startsWith('/api/headlamp')
      ? strippedPath.slice(4) // "/api/flux/overview" → "/flux/overview"
      : strippedPath;

  const backPath = generatePath(Routes.Project, { projectName });
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [headlampPath, setHeadlampPath] = useState<string>(sanitisedInitialPath);
  const isUnsupportedPath = headlampPath.includes('/settings') || headlampPath.includes('/plugins');

  // Register ShellBar actions only in open-source mode
  useEffect(() => {
    setMcpActions(mcp.kubeconfig, mcp.name, mcp.roleBindings, projectName, workspaceName, undefined, undefined, () =>
      navigate(backPath),
    );
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

  // Register and load the kubeconfig, then set the iframe src
  useEffect(() => {
    if (!mcp.kubeconfig) return;
    const controller = new AbortController();
    const baseSrc = `/api/headlamp/c/${encodeURIComponent(clusterAlias)}`;
    registerKubeconfigWithBff(mcp.kubeconfig, clusterAlias, controller.signal)
      .then(() => {
        if (!controller.signal.aborted)
          setIframeSrc(`${baseSrc}${sanitisedInitialPath || '/flux/overview'}`);
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

  // Poll iframe pathname (same-origin via BFF proxy) and sync to URL search param.
  // Strip the baseSrc prefix so only the Headlamp-internal path (e.g. /flux/...) is stored.
  useEffect(() => {
    if (!iframeSrc) return;
    const intervalId = setInterval(() => {
      try {
        const fullPathname = iframeRef.current?.contentWindow?.location?.pathname ?? '';
        if (!fullPathname) return;
        const internalPath = fullPathname.startsWith(baseSrcPrefix)
          ? fullPathname.slice(baseSrcPrefix.length) || '/'
          : fullPathname;
        // Don't persist the root path — that's the Headlamp home page before the
        // kiosk plugin has had a chance to redirect to /flux/overview. Writing '/'
        // into headlampPath would cause the next mount to load the wrong page.
        if (internalPath === '/' || !internalPath) return;
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

  if (error) {
    return (
      <IllustratedBanner
        illustrationName={IllustrationMessageType.SimpleError}
        title={t('McpPage.headlampUnavailableTitle')}
        subtitle={t('McpPage.headlampUnavailableSubtitle')}
        help={{ link: `${documentationBaseUrl}/docs/help`, buttonText: t('McpPage.headlampGetSupport') }}
      />
    );
  }

  if (!iframeSrc) return null;

  return (
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

// Registers only mcpName in ShellBarMcpActionsContext so the mode toggle appears in legacy mode.
// No kubeconfig, roleBindings, or navigateBack — those extras are open-source only.
function LegacyModeShellBarSync({ controlPlaneName }: { controlPlaneName: string }) {
  const { setMcpActions, clearMcpActions } = useShellBarMcpActions();
  useEffect(() => {
    setMcpActions(undefined, controlPlaneName);
    return () => {
      clearMcpActions();
    };
  }, [controlPlaneName, setMcpActions, clearMcpActions]);
  return null;
}

// MCP_PAGE_SECTIONS for legacy view (no headlamp tab — that's handled via mode switch)
const MCP_PAGE_SECTIONS = ['overview', 'crossplane', 'flux', 'landscaper'] as const;
export type McpPageSectionId = (typeof MCP_PAGE_SECTIONS)[number];

export default function McpPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
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

  // Open-source mode: full-screen Headlamp iframe. ShellBar gets back/kubeconfig/members/switch.
  if (mode === 'open-source') {
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

  // Legacy (beginner) mode: ObjectPage unchanged from main. ShellBar stays plain.
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
                        workspaceName={mcp?.status?.access?.namespace}
                        resourceType={'managedcontrolplanes'}
                        resourceName={controlPlaneName}
                        withoutApiConfig
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
                    <McpMembersAvatarView
                      roleBindings={mcp.spec?.authorization?.roleBindings}
                      project={projectName}
                      workspace={workspaceName}
                    />
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
                <ObjectPageSubSection id="dashboard" titleText="" className={styles.sectionNoTitle}>
                  <ComponentsDashboard
                    components={mcp.spec?.components}
                    onInstallButtonClick={onEditComponents}
                    onNavigateToMcpSection={(sectionId) => {
                      setTabFromSection(sectionId);
                    }}
                  />
                </ObjectPageSubSection>
                <ObjectPageSubSection id="graph" titleText="" className={styles.sectionNoTitle}>
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
