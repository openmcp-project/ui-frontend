import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/locked.js';
import '@ui5/webcomponents-icons/dist/product';
import '@ui5/webcomponents-icons/dist/slim-arrow-right';
import { Button, BusyIndicator, FlexBox, Icon, ObjectPageSection, Popover, Title } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureToggle } from '../../../context/FeatureToggleContext.tsx';
import { isForbiddenError } from '../../../lib/api/error.ts';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { useLink } from '../../../lib/shared/useLink.ts';
import { useDeleteWorkspace as _useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { useMcpsQuery as _useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { useWorkspaceV2ComponentsQuery } from '../../../spaces/onboarding/hooks/useWorkspaceV2ComponentsQuery.ts';
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
import { ControlPlanesListMenu } from '../ControlPlanesListMenu.tsx';
import { MembersAvatarView } from './MembersAvatarView.tsx';
import styles from './WorkspacesList.module.css';
import { useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { MemberKind } from '../../../lib/api/types/shared/members.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';

interface Props {
  projectName: string;
  workspace: Workspace;
  search?: string;
  isExpanded?: boolean;
  isFetchGranted?: boolean;
  onFetchComplete?: () => void;
  onForbiddenDetected?: () => void;
  onToggleExpanded?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  useMcpsQuery?: typeof _useMcpsQuery;
  useDeleteWorkspace?: typeof _useDeleteWorkspace;
}

export function ControlPlaneListWorkspaceGridTile({
  projectName,
  workspace,
  search = '',
  isExpanded,
  isFetchGranted = false,
  onFetchComplete,
  onForbiddenDetected,
  onToggleExpanded,
  onVisibilityChange,
  useMcpsQuery = _useMcpsQuery,
  useDeleteWorkspace = _useDeleteWorkspace,
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
  const { user, isPending: authPending } = useAuthOnboarding();

  // Workspace access check: user must appear in workspace.spec.members.
  // Case-insensitive on both kind and email — defensive against API casing variations.
  // null = auth not yet resolved (treated as optimistic allow).
  const isMember: boolean | null =
    authPending || !user
      ? null
      : (workspace.spec.members ?? []).some(
          (m) =>
            m.kind.toLowerCase() === MemberKind.User.toLowerCase() &&
            m.name.toLowerCase() === user.email.toLowerCase(),
        );

  // Only skip fetching when we're certain the user is not a member.
  const shouldFetch = isMember !== false && (!!isExpanded || isFetchGranted);

  const [dialogDeleteWsIsOpen, setDialogDeleteWsIsOpen] = useState(false);
  const [dialogEditWsIsOpen, setDialogEditWsIsOpen] = useState(false);

  const {
    data: managedControlPlanes,
    error: cpsError,
    isPending,
    hasReceivedData,
  } = useMcpsQuery(shouldFetch ? `project-${projectName}--ws-${workspaceName}` : undefined);

  // Signal the queue when this tile's fetch settles (data OR error) so the next one can start.
  // Non-members never fetch, so signal immediately once isMember is resolved as false.
  const hasFiredComplete = useRef(false);
  useEffect(() => {
    const settled = hasReceivedData || !!cpsError || isMember === false;
    if (!settled || hasFiredComplete.current) return;
    hasFiredComplete.current = true;
    onFetchComplete?.();
  }, [hasReceivedData, cpsError, isMember, onFetchComplete]);

  // Only fetch components for the expanded workspace — collapsed tiles don't show them.
  const { componentsMap, isLoading: isLoadingV2Components } = useWorkspaceV2ComponentsQuery(
    isExpanded ? workspace.status?.namespace : undefined,
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

  const query = search.trim().toLowerCase();
  const workspaceMatches =
    query && (workspaceName.toLowerCase().includes(query) || workspaceDisplayName.toLowerCase().includes(query));
  const visibleMcps =
    query && !workspaceMatches
      ? (managedControlPlanes ?? []).filter(
          (mcp) =>
            mcp.metadata.name.toLowerCase().includes(query) ||
            (mcp.metadata.annotations?.[DISPLAY_NAME_ANNOTATION] ?? '').toLowerCase().includes(query),
        )
      : managedControlPlanes;

  const hasMcpMatch = hasReceivedData && !isPending && query && !workspaceMatches && (visibleMcps ?? []).length > 0;
  // Hide tile when searching and nothing matches (workspace name/displayName or any CP name)
  const hidden = hasReceivedData && !isPending && query && !workspaceMatches && !hasMcpMatch;
  // Force-collapse when forbidden — the locked header replaces the expand toggle
  const shouldCollapsePanel = isForbidden || (query ? !(workspaceMatches || hasMcpMatch) : !isExpanded);

  useEffect(() => {
    onVisibilityChange?.(!hidden);
  }, [hidden, onVisibilityChange]);

  const { deleteWorkspace } = useDeleteWorkspace(projectNamespace, workspaceName);
  const telemetry = useTelemetry();
  const { mcpCreationGuide } = useLink();

  function isWorkspaceReady(currentWorkspace: Workspace): boolean {
    return currentWorkspace.status != null && currentWorkspace.status.namespace != null;
  }

  const errorView = (() => {
    if (!cpsError || isForbidden) return null;
    return <IllustratedError title={t('ControlPlaneListWorkspaceGridTile.loadingErrorMessage')} />;
  })();

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
            <MembersAvatarView
              members={uniqueMembers}
              project={projectName}
              workspace={workspaceName}
              source="workspace-grid"
            />
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
                setInitialTemplateName={setInitialTemplateName}
                setIsCreateManagedControlPlaneWizardOpen={setIsCreateManagedControlPlaneWizardOpen}
                setIsCreateManagedControlPlaneWizardOpenV2={setIsCreateManagedControlPlaneWizardOpenV2}
              />
            </FlexBox>
          </div>

          {!shouldCollapsePanel && (
            <div className={styles.workspaceBody}>
              {errorView ? (
                errorView
              ) : !hasReceivedData || (isPending && managedControlPlanes?.length === 0) ? (
                <BusyIndicator active delay={0} size="M" />
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
                        design={'Emphasized'}
                        icon={'add'}
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
                      <ControlPlaneCard
                        key={`${mcp.metadata.name}--${mcp.metadata.namespace}`}
                        controlPlane={mcp}
                        projectName={projectName}
                        workspace={workspace}
                        v2ComponentsMap={componentsMap}
                        isLoadingV2Components={isLoadingV2Components}
                      />
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
          telemetry.track({ name: 'workspace.deleted', source: 'card' });
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
