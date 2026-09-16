import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/locked.js';
import '@ui5/webcomponents-icons/dist/product';
import '@ui5/webcomponents-icons/dist/slim-arrow-right';
import { BusyIndicator, Button, FlexBox, Icon, ObjectPageSection, Popover, Title } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureToggle } from '../../../context/FeatureToggleContext.tsx';
import { isForbiddenError } from '../../../lib/api/error.ts';
import { CREATED_BY_ANNOTATION, DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { MemberKind, MemberRoles } from '../../../lib/api/types/shared/members.ts';
import { useLink } from '../../../lib/shared/useLink.ts';
import { useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
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
  onForbiddenDetected?: () => void;
  onToggleExpanded?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  useAuthOnboardingHook?: typeof useAuthOnboarding;
  useDeleteWorkspace?: typeof _useDeleteWorkspace;
  useMcpsQuery?: typeof _useMcpsQuery;
  useMcpV2ComponentsListQuery?: typeof _useMcpV2ComponentsListQuery;
}

export function ControlPlaneListWorkspaceGridTile({
  projectName,
  workspace,
  search = '',
  isExpanded,
  onForbiddenDetected,
  onToggleExpanded,
  onVisibilityChange,
  useAuthOnboardingHook = useAuthOnboarding,
  useDeleteWorkspace = _useDeleteWorkspace,
  useMcpsQuery = _useMcpsQuery,
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
  const { user, isPending: authPending } = useAuthOnboardingHook();

  const isMember: boolean | null =
    authPending || !user
      ? null
      : (workspace.spec.members ?? []).some(
          (m) =>
            m.kind.toLowerCase() === MemberKind.User.toLowerCase() && m.name.toLowerCase() === user.email.toLowerCase(),
        );

  const [dialogDeleteWsIsOpen, setDialogDeleteWsIsOpen] = useState(false);
  const [dialogEditWsIsOpen, setDialogEditWsIsOpen] = useState(false);

  const mcpNamespace = `project-${projectName}--ws-${workspaceName}`;

  const query = search.trim().toLowerCase();
  const workspaceMatches =
    query && (workspaceName.toLowerCase().includes(query) || workspaceDisplayName.toLowerCase().includes(query));

  // A match on an MCP *name* (not the workspace name) is only known after the 'minimal' fetch
  // returns. Such a workspace starts in 'minimal' mode and upgrades to 'full' once discovered —
  // otherwise its cards render from the minimal payload (no spec/V2 data) and show a false
  // "nothing installed" state.
  const [needsFullMcpData, setNeedsFullMcpData] = useState(false);

  const shouldRenderCardsWithFullData = isExpanded || workspaceMatches || needsFullMcpData;
  const fetchMode: McpsQueryMode =
    isMember === false ? 'skip' : shouldRenderCardsWithFullData ? 'full' : query ? 'minimal' : 'skip';
  const { data: managedControlPlanes, error: cpsError, isPending } = useMcpsQuery(mcpNamespace, { mode: fetchMode });

  // One combined query for all V2 component status in this workspace, instead of each card
  // firing its own 6 queries — see useMcpV2ComponentsListQuery.
  const { componentsByName: v2ComponentsByName, isLoading: isLoadingV2ComponentsList } = useMcpV2ComponentsListQuery(
    mcpNamespace,
    !enableMcpV2 || fetchMode !== 'full',
  );

  const isForbidden = isMember === false || (!!cpsError && isForbiddenError(cpsError));
  const [forbiddenPopoverOpen, setForbiddenPopoverOpen] = useState(false);
  const forbiddenButtonId = `forbidden-btn-${workspaceName}`;

  const hasFiredForbidden = useRef(false);
  useEffect(() => {
    if (!isForbidden || hasFiredForbidden.current) return;
    hasFiredForbidden.current = true;
    onForbiddenDetected?.();
  }, [isForbidden, onForbiddenDetected]);

  const visibleMcps =
    query && !workspaceMatches
      ? (managedControlPlanes ?? []).filter(
          (mcp) =>
            mcp.metadata.name.toLowerCase().includes(query) ||
            (mcp.metadata.annotations?.[DISPLAY_NAME_ANNOTATION] ?? '').toLowerCase().includes(query),
        )
      : managedControlPlanes;

  const hasMcpMatch = !isPending && query && !workspaceMatches && (visibleMcps ?? []).length > 0;
  const hidden = !isPending && query && !workspaceMatches && !hasMcpMatch;

  const shouldCollapsePanel =
    isForbidden || (query ? !(workspaceMatches || hasMcpMatch || needsFullMcpData) : !isExpanded);

  // Adjust state during render (not in an effect — avoids an extra render/fetch cascade) once
  // `hasMcpMatch` is derivable. Each branch fires once: its guard turns false right after.
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

  const workspaceAdminEmails = useMemo(() => {
    const adminMembers = (workspace.spec.members ?? [])
      .filter((m) => m.kind === 'User' && m.roles.includes(MemberRoles.admin))
      .map((m) => m.name);
    if (adminMembers.length > 0) return adminMembers;
    const createdBy = workspace.metadata.annotations?.[CREATED_BY_ANNOTATION];
    return createdBy ? [createdBy] : [];
  }, [workspace.spec.members, workspace.metadata.annotations]);

  const requestAccessMailtoHref = (() => {
    if (workspaceAdminEmails.length === 0) return null;
    const subject = encodeURIComponent(
      t('ControlPlaneListWorkspaceGridTile.accessRequestSubject', { workspaceName, projectName }),
    );
    const body = encodeURIComponent(
      t('ControlPlaneListWorkspaceGridTile.accessRequestBody', { workspaceName, projectName }),
    );
    return `mailto:${workspaceAdminEmails.join(',')}?subject=${subject}&body=${body}`;
  })();

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
            button={
              requestAccessMailtoHref ? (
                <a href={requestAccessMailtoHref}>
                  <Button design="Transparent" icon="email">
                    {t('ControlPlaneListWorkspaceGridTile.askAdminButton')}
                  </Button>
                </a>
              ) : undefined
            }
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

    return (workspace.spec.members ?? []).filter((member: { name?: string; namespace?: string | null }) => {
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
            {isForbidden ? (
              <>
                <button
                  id={forbiddenButtonId}
                  type="button"
                  className={styles.workspaceToggle}
                  aria-expanded={false}
                  onClick={() => setForbiddenPopoverOpen((o) => !o)}
                >
                  <Icon name="locked" className={styles.workspaceIcon} />
                  <span className={`${styles.workspaceEyebrow} mono-font`}>{t('Entities.Workspace')} ·</span>
                  <Title level="H3" className={styles.workspaceTitle}>
                    {showDisplayName ? workspaceDisplayName : workspaceName}
                  </Title>
                </button>
                <Popover
                  open={forbiddenPopoverOpen}
                  opener={forbiddenButtonId}
                  placement={PopoverPlacement.Bottom}
                  onClose={() => setForbiddenPopoverOpen(false)}
                >
                  <div style={{ padding: '0.5rem 1rem' }}>
                    <p>{t('ControlPlaneListWorkspaceGridTile.permissionErrorMessage')}</p>
                    <p style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                      {t('ControlPlaneListWorkspaceGridTile.permissionErrorMessageSubtitle')}
                    </p>
                  </div>
                </Popover>
              </>
            ) : isMember === null ? (
              <div className={styles.workspaceToggle}>
                <BusyIndicator active delay={0} size="S" />
                <span className={`${styles.workspaceEyebrow} mono-font`}>{t('Entities.Workspace')} ·</span>
                <Title level="H3" className={styles.workspaceTitle}>
                  {showDisplayName ? workspaceDisplayName : workspaceName}
                </Title>
              </div>
            ) : (
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
            )}
            <CopyButton collapsible text={workspace.status?.namespace || '-'} source="workspace-namespace" />
            <div className={styles.headerSpacer} />
            {!shouldCollapsePanel && <MembersAvatarView members={uniqueMembers} source="workspace-grid" />}
            <FlexBox justifyContent={'SpaceBetween'} gap={10}>
              {isForbidden && requestAccessMailtoHref && (
                <a href={requestAccessMailtoHref}>
                  <Button design="Transparent" icon="email">
                    {t('ControlPlaneListWorkspaceGridTile.askAdminButton')}
                  </Button>
                </a>
              )}
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
                disabled={isForbidden}
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
                          // A CP with nothing installed gets no `componentsByName` entry, which by
                          // key presence alone looks the same as "not fetched yet". Once the fetch
                          // finishes, default a missing entry to `{}` (ControlPlaneCard reads
                          // `undefined` as "still loading" and hides the add-component button).
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
      {/* Mounted only while open. The open/closed flag lives in this tile's own `useState`, which
          already survives parent re-renders, so conditional mounting doesn't lose form state — it
          only unmounts on close (intended) or if this tile unmounts. Tiles are kept mounted across
          transient empty workspace responses by ControlPlaneListAllWorkspaces. Mounting the wizards
          unconditionally would run their hooks (auth, GetManagedComponents query) on every tile even
          while closed. */}
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
