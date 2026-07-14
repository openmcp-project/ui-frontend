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
import styles from './ControlPlanePageV2.module.css';
// throws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import { useTranslation } from 'react-i18next';
import { BreadcrumbFeedbackHeader } from '../../../components/Core/BreadcrumbFeedbackHeader.tsx';
import IllustratedError from '../../../components/Shared/IllustratedError.tsx';

import { NotFoundBanner } from '../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx';
import { YamlViewButton } from '../../../components/Yaml/YamlViewButton.tsx';
import { isNotFoundError } from '../../../lib/api/error.ts';

import { useEffect, useMemo, useState } from 'react';
import { McpStatusSection } from '../../../components/ControlPlane/McpStatusSection.tsx';

import { McpMembersAvatarView } from '../../../components/ControlPlanes/McpMembersAvatarView/McpMembersAvatarView.tsx';
import { EditMembers } from '../../../components/Members/EditMembers.tsx';
import { ControlPlaneIdp, Member } from '../../../lib/api/types/shared/members.ts';
import { convertRoleBindingsToMembers } from '../../../utils/convertRoleBindingsToMembers.ts';
import { Center } from '../../../components/Ui/Center/Center.tsx';
import { ControlPlanePageMenu } from '../../../components/ControlPlanes/ControlPlanePageMenu.tsx';
import { WizardStepType } from '../../../components/Wizards/CreateControlPlaneV2/CreateControlPlaneV2WizardContainer.tsx';
import { EditControlPlaneV2WizardDataLoader } from '../../../components/Wizards/CreateControlPlaneV2/EditControlPlaneV2WizardDataLoader.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { McpContextProvider, WithinManagedControlPlane } from '../../../lib/shared/McpContext.tsx';
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

const MCP_PAGE_SECTIONS = ['overview', 'crossplane', 'flux', 'landscaper'] as const;
export type McpPageSectionId = (typeof MCP_PAGE_SECTIONS)[number];

export default function ControlPlanePageV2() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const namespace = projectName && workspaceName ? `project-${projectName}--ws-${workspaceName}` : undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
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

  // Prototype: editable members + additional IdPs, seeded from the control
  // plane's default-provider roleBindings. In-memory only — nothing is
  // persisted back to the ControlPlane spec yet.
  const seededMembers = useMemo(() => convertRoleBindingsToMembers(roleBindings), [roleBindings]);
  const [members, setMembers] = useState<Member[]>([]);
  const [idps, setIdps] = useState<ControlPlaneIdp[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMembers(seededMembers);
  }, [seededMembers]);
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
                <ObjectPageSubSection id="members" titleText={t('McpPage.membersTitle')} className={styles.section}>
                  <EditMembers
                    members={members}
                    type={'mcp'}
                    isV2
                    requireAtLeastOneMember={false}
                    projectName={projectName}
                    workspaceName={workspaceName}
                    idps={idps}
                    onIdpsChanged={setIdps}
                    onMemberChanged={setMembers}
                  />
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
