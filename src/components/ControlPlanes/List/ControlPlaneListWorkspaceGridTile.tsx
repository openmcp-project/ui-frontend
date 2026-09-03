import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/product';
import '@ui5/webcomponents-icons/dist/slim-arrow-right';
import { Button, FlexBox, Icon, ObjectPageSection, Title } from '@ui5/webcomponents-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureToggle } from '../../../context/FeatureToggleContext.tsx';
import { isForbiddenError } from '../../../lib/api/error.ts';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { useLink } from '../../../lib/shared/useLink.ts';
import { useDeleteWorkspace as _useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { McpsQueryMode, useMcpsQuery as _useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { useMcpV2ComponentsListQuery as _useMcpV2ComponentsListQuery } from '../../../spaces/controlPlaneV2/components/Kpi/useMcpV2ComponentsListQuery.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import { EditWorkspaceDialogContainer } from '../../Dialogs/EditWorkspaceDialogContainer.tsx';
import { DeleteWorkspaceDialog } from '../../Dialogs/KubectlCommandInfo/KubectlDeleteWorkspaceDialog.tsx';
import { CopyButton } from '../../Shared/CopyButton.tsx';
import IllustratedError from '../../Shared/IllustratedError.tsx';
import { IllustratedBanner } from '../../Ui/IllustratedBanner/IllustratedBanner.tsx';
import { CreateControlPlaneV2WizardContainer } from '../../Wizards/CreateControlPlaneV2/CreateControlPlaneV2WizardContainer.tsx';
import { CreateManagedControlPlaneWizardContainer } from '../../Wizards/CreateManagedControlPlane/CreateManagedControlPlaneWizardContainer.tsx';
import { YamlViewButton } from '../../Yaml/YamlViewButton.tsx';
import { ControlPlaneCard } from '../ControlPlaneCard/ControlPlaneCard.tsx';
import { ControlPlaneCardSkeleton } from '../ControlPlaneCard/ControlPlaneCardSkeleton.tsx';
import { ObservableCard } from './ObservableCard.tsx';
import { ControlPlanesListMenu } from '../ControlPlanesListMenu.tsx';
import { MembersAvatarView } from './MembersAvatarView.tsx';
import styles from './WorkspacesList.module.css';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';

interface Props {
  projectName: string;
  workspace: Workspace;
  search?: string;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  useMcpsQuery?: typeof _useMcpsQuery;
  useDeleteWorkspace?: typeof _useDeleteWorkspace;
  useMcpV2ComponentsListQuery?: typeof _useMcpV2ComponentsListQuery;
}

export function ControlPlaneListWorkspaceGridTile({
  projectName,
  workspace,
  search = '',
  isExpanded,
  onToggleExpanded,
  onVisibilityChange,
  useMcpsQuery = _useMcpsQuery,
  useDeleteWorkspace = _useDeleteWorkspace,
  useMcpV2ComponentsListQuery = _useMcpV2ComponentsListQuery,
}: Props) {
  const [isCreateManagedControlPlaneWizardOpen, setIsCreateManagedControlPlaneWizardOpen] = useState(false);
  const [isCreateManagedControlPlaneWizardOpenV2, setIsCreateManagedControlPlaneWizardOpenV2] = useState(false);
  const [initialTemplateName, setInitialTemplateName] = useState<string | undefined>(undefined);
  const workspaceName = workspace.metadata.name;
  const workspaceDisplayName = workspace.metadata.annotations?.[DISPLAY_NAME_ANNOTATION] || '';
  const showDisplayName = workspaceDisplayName.length > 0;
  const projectNamespace = workspace.metadata.namespace;

  const { t } = useTranslation();
  const { enableMcpV2 } = useFeatureToggle();

  const [dialogDeleteWsIsOpen, setDialogDeleteWsIsOpen] = useState(false);
  const [dialogEditWsIsOpen, setDialogEditWsIsOpen] = useState(false);

  const mcpNamespace = `project-${projectName}--ws-${workspaceName}`;

  // `query`/`workspaceMatches` only depend on props, not on fetched data, so they're available
  // before the fetch-mode decision below.
  const query = search.trim().toLowerCase();
  const workspaceMatches =
    query && (workspaceName.toLowerCase().includes(query) || workspaceDisplayName.toLowerCase().includes(query));

  // Whether an MCP *name* (not just the workspace name) matches can only be known once the
  // 'minimal' search fetch has returned — so a workspace that expands purely because one of its
  // MCPs matched by name starts in 'minimal' mode and upgrades to 'full' once that's discovered.
  // Without this upgrade, cards would render with the minimal query's payload (no `spec`, no V2
  // component data) and show a false "nothing installed" state instead of the real data.
  const [needsFullMcpData, setNeedsFullMcpData] = useState(false);

  const shouldRenderCardsWithFullData = isExpanded || workspaceMatches || needsFullMcpData;
  const fetchMode: McpsQueryMode = shouldRenderCardsWithFullData ? 'full' : query ? 'minimal' : 'skip';
  const { data: managedControlPlanes, error: cpsError, isPending } = useMcpsQuery(mcpNamespace, { mode: fetchMode });

  // One combined query for every V2 control plane's component status in this workspace instead
  // of each ControlPlaneCard firing its own 6 queries — see useMcpV2ComponentsListQuery.
  const { componentsByName: v2ComponentsByName, isLoading: isLoadingV2ComponentsList } = useMcpV2ComponentsListQuery(
    mcpNamespace,
    !enableMcpV2 || fetchMode !== 'full',
  );

  const visibleMcps =
    query && !workspaceMatches
      ? (managedControlPlanes ?? []).filter(
          (mcp) =>
            mcp.metadata.name.toLowerCase().includes(query) ||
            (mcp.metadata.annotations?.[DISPLAY_NAME_ANNOTATION] ?? '').toLowerCase().includes(query),
        )
      : managedControlPlanes;

  const hasMcpMatch = !isPending && query && !workspaceMatches && (visibleMcps ?? []).length > 0;
  // Hide tile when searching and nothing matches (workspace name/displayName or any CP name)
  const hidden = !isPending && query && !workspaceMatches && !hasMcpMatch;
  // `needsFullMcpData` (not just `hasMcpMatch`) keeps the panel expanded through the 'minimal' →
  // 'full' fetch-mode upgrade below — `hasMcpMatch` momentarily goes back to `false` while the
  // upgraded 'full' query is loading (isPending flips true again), which would otherwise collapse
  // the panel right as it should be settling into showing real data.
  const shouldCollapsePanel = query ? !(workspaceMatches || hasMcpMatch || needsFullMcpData) : !isExpanded;

  // Adjust state during rendering (not in an effect — avoids an extra render/fetch cascade) once
  // `hasMcpMatch` becomes derivable from this render's data. Each branch only fires once per
  // transition since the guard condition becomes false immediately after the update is applied.
  if (hasMcpMatch && !needsFullMcpData) {
    setNeedsFullMcpData(true);
  } else if (!query && needsFullMcpData) {
    // Search cleared — drop back to on-demand fetching unless manually expanded.
    setNeedsFullMcpData(false);
  }

  useEffect(() => {
    onVisibilityChange?.(!hidden);
  }, [hidden, onVisibilityChange]);

  const { deleteWorkspace } = useDeleteWorkspace(projectNamespace, workspaceName);
  const telemetry = useTelemetry();
  const { mcpCreationGuide } = useLink();
  const errorView = createErrorView(cpsError);

  function isWorkspaceReady(currentWorkspace: Workspace): boolean {
    return currentWorkspace.status != null && currentWorkspace.status.namespace != null;
  }

  function createErrorView(error: Error | undefined) {
    if (error) {
      if (isForbiddenError(error)) {
        return (
          <IllustratedError
            title={t('ControlPlaneListWorkspaceGridTile.permissionErrorMessage')}
            details={t('ControlPlaneListWorkspaceGridTile.permissionErrorMessageSubtitle')}
            compact={true}
          />
        );
      } else {
        return <IllustratedError title={t('ControlPlaneListWorkspaceGridTile.loadingErrorMessage')} />;
      }
    }
    return null;
  }

  const uniqueMembers = useMemo(() => {
    const seenKeys = new Set<string>();
    const fallbackNamespace = workspace.status?.namespace ?? '';

    return (workspace.spec.members ?? []).filter((member: { name?: string; namespace?: string }) => {
      const memberNamespace = member?.namespace ?? fallbackNamespace;
      const memberName = String(member?.name ?? '')
        .trim()
        .toLowerCase();
      if (!memberName) return false;

      const dedupeKey = `${memberNamespace}::${memberName}`;
      if (seenKeys.has(dedupeKey)) return false;
      seenKeys.add(dedupeKey);
      return true;
    });
  }, [workspace.spec.members, workspace.status?.namespace]);

  if (hidden) return null;

  return (
    <div>
      <ObjectPageSection
        key={`${projectName}${workspaceName}`}
        id={workspaceName}
        titleText={workspaceName}
        hideTitleText
      >
        <section className={styles.workspaceSection} data-testid={`workspace-panel-${workspaceName}`}>
          <div className={styles.workspaceHeader}>
            <button
              type="button"
              className={styles.workspaceToggle}
              aria-expanded={!shouldCollapsePanel}
              onClick={onToggleExpanded}
            >
              <Icon
                name="slim-arrow-right"
                className={`${styles.chevron} ${shouldCollapsePanel ? '' : styles.chevronOpen}`}
              />
              <Icon name="product" className={styles.workspaceIcon} />
              <span className={`${styles.workspaceEyebrow} mono-font`}>{t('Entities.Workspace')} ·</span>
              <Title level="H3" className={styles.workspaceTitle}>
                {showDisplayName ? workspaceDisplayName : workspaceName}{' '}
                {!isWorkspaceReady(workspace) ? '(Loading)' : ''}
              </Title>
            </button>
            <CopyButton collapsible text={workspace.status?.namespace || '-'} source="workspace-namespace" />
            <div className={styles.headerSpacer} />
            <MembersAvatarView members={uniqueMembers} source="workspace-grid" />
            <FlexBox justifyContent={'SpaceBetween'} gap={10}>
              <YamlViewButton
                variant="loader"
                workspaceName={workspace.metadata.namespace}
                resourceName={workspaceName}
                resourceType={'workspaces'}
              />
              <ControlPlanesListMenu
                setDialogDeleteWsIsOpen={setDialogDeleteWsIsOpen}
                setDialogEditWsIsOpen={setDialogEditWsIsOpen}
                setIsCreateManagedControlPlaneWizardOpen={setIsCreateManagedControlPlaneWizardOpen}
                setInitialTemplateName={setInitialTemplateName}
                setIsCreateManagedControlPlaneWizardOpenV2={setIsCreateManagedControlPlaneWizardOpenV2}
              />
            </FlexBox>
          </div>

          {!shouldCollapsePanel && (
            <div className={styles.workspaceBody}>
              {errorView ? (
                errorView
              ) : isPending ? (
                <div className={styles.wrapper}>
                  <div className={styles.grid}>
                    <ControlPlaneCardSkeleton />
                    <ControlPlaneCardSkeleton />
                    <ControlPlaneCardSkeleton />
                  </div>
                </div>
              ) : managedControlPlanes?.length === 0 ? (
                <IllustratedBanner
                  title={t('IllustratedBanner.titleMessage')}
                  subtitle={t('IllustratedBanner.subtitleMessage')}
                  illustrationName={IllustrationMessageType.NoData}
                  compact
                  help={{
                    link: mcpCreationGuide,
                    buttonText: t('IllustratedBanner.helpButton'),
                  }}
                  button={
                    <>
                      <Button
                        className={styles.createButton}
                        icon={'add'}
                        design={'Emphasized'}
                        onClick={() => {
                          setIsCreateManagedControlPlaneWizardOpen(true);
                        }}
                      >
                        {t('ControlPlaneListToolbar.createNewManagedControlPlane')}
                      </Button>

                      {enableMcpV2 && (
                        <Button
                          className={styles.createButton}
                          icon={'add'}
                          onClick={() => {
                            setIsCreateManagedControlPlaneWizardOpenV2(true);
                          }}
                        >
                          {t('ControlPlaneListToolbar.createNewControlPlane')}
                        </Button>
                      )}
                    </>
                  }
                />
              ) : (
                <div className={styles.wrapper}>
                  <div className={styles.grid}>
                    {visibleMcps?.map((mcp) => (
                      <ObservableCard key={`${mcp.metadata.name}--${mcp.metadata.namespace}`}>
                        <ControlPlaneCard
                          controlPlane={mcp}
                          projectName={projectName}
                          workspace={workspace}
                          // A CP with nothing installed never gets a `componentsByName` entry (see
                          // indexByName in useMcpV2ComponentsListQuery), which is indistinguishable
                          // from "not fetched yet" by key presence alone — so once the workspace-level
                          // fetch has actually finished, default a missing entry to `{}` here rather
                          // than leaving it `undefined` (which ControlPlaneCard reads as "still
                          // loading" and never shows the add-component button for).
                          v2Components={
                            mcp.version === 'v2'
                              ? (v2ComponentsByName[mcp.metadata.name] ?? (isLoadingV2ComponentsList ? undefined : {}))
                              : undefined
                          }
                          isLoadingV2Components={mcp.version === 'v2' && isLoadingV2ComponentsList}
                        />
                      </ObservableCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </ObjectPageSection>
      <DeleteConfirmationDialog
        resourceName={workspaceName}
        kubectlDialog={({ isOpen, onClose }) => (
          <DeleteWorkspaceDialog
            projectName={projectName}
            resourceName={workspaceName}
            isOpen={isOpen}
            onClose={onClose}
          />
        )}
        isOpen={dialogDeleteWsIsOpen}
        setIsOpen={setDialogDeleteWsIsOpen}
        onDeletionConfirmed={async () => {
          telemetry.track({ category: 'workspace', action: 'deleted', source: 'card' });
          await deleteWorkspace();
        }}
      />
      <EditWorkspaceDialogContainer
        isOpen={dialogEditWsIsOpen}
        setIsOpen={setDialogEditWsIsOpen}
        workspaceName={workspaceName}
        namespace={projectNamespace}
      />
      {isCreateManagedControlPlaneWizardOpen ? (
        <CreateManagedControlPlaneWizardContainer
          isOpen={isCreateManagedControlPlaneWizardOpen}
          setIsOpen={setIsCreateManagedControlPlaneWizardOpen}
          projectName={projectNamespace}
          workspaceName={workspaceName}
          initialTemplateName={initialTemplateName}
        />
      ) : null}
      {isCreateManagedControlPlaneWizardOpenV2 ? (
        <CreateControlPlaneV2WizardContainer
          isOpen={isCreateManagedControlPlaneWizardOpenV2}
          setIsOpen={setIsCreateManagedControlPlaneWizardOpenV2}
          projectName={projectNamespace}
          workspaceName={workspaceName}
          initialTemplateName={initialTemplateName}
        />
      ) : null}
    </div>
  );
}
