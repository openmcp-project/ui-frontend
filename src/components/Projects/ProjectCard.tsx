import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { purposeIndicationVars, purposeLabel } from '../../lib/supportInfo.ts';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import { projectnameToNamespace } from '../../utils/index.ts';
import { YamlViewButton } from '../Yaml/YamlViewButton.tsx';
import { ProjectsListItemMenu } from './ProjectsListItemMenu.tsx';
import { MembersAvatarView } from '../ControlPlanes/List/MembersAvatarView.tsx';
import { CopyButton } from '../Shared/CopyButton.tsx';
import { ProjectSupportInfoPopover } from './ProjectSupportInfoPopover.tsx';
import { EditProjectDialogContainer } from '../Dialogs/EditProjectDialogContainer.tsx';
import styles from './ProjectCard.module.css';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import { useRememberedProject } from '../../hooks/useRememberedProject.ts';

interface Props {
  projectName: string;
  setAsDefaultRef: React.RefObject<boolean>;
  useProjectMembers?: typeof _useProjectMembers;
  onDisplayNameResolved?: (projectName: string, displayName: string | undefined) => void;
  onProjectSelect?: (projectName: string) => void;
  onPurposeResolved?: (projectName: string, landscape: string | undefined) => void;
  onTimestampResolved?: (projectName: string, timestamp: string | undefined) => void;
}

export function ProjectCard({
  projectName,
  setAsDefaultRef,
  useProjectMembers = _useProjectMembers,
  onDisplayNameResolved,
  onProjectSelect,
  onPurposeResolved,
  onTimestampResolved,
}: Props) {
  const { t } = useTranslation();
  const navigate = useLuigiNavigate();
  const telemetry = useTelemetry();
  const { setRememberedProject } = useRememberedProject();
  const ribbonId = useId();

  const {
    members,
    displayName,
    creationTimestamp,
    supportLandscape,
    supportServiceIds,
    supportSecurityContacts,
    supportOpsContacts,
    isLoading,
  } = useProjectMembers(projectName);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      onPurposeResolved?.(projectName, supportLandscape);
    }
  }, [isLoading, supportLandscape, projectName, onPurposeResolved]);

  useEffect(() => {
    if (!isLoading) {
      onDisplayNameResolved?.(projectName, displayName);
    }
  }, [isLoading, displayName, projectName, onDisplayNameResolved]);

  useEffect(() => {
    if (!isLoading) {
      onTimestampResolved?.(projectName, creationTimestamp);
    }
  }, [isLoading, creationTimestamp, projectName, onTimestampResolved]);

  const { bg: ribbonBg, text: ribbonText } = purposeIndicationVars(supportLandscape);

  const handleNavigate = useCallback(() => {
    if (setAsDefaultRef.current) {
      setRememberedProject(projectName);
      telemetry.track({ name: 'project.remembered', source: 'list' });
      telemetry.track({ name: 'project-list.set-as-default', trigger: 'click' });
    }
    telemetry.track({ name: 'project-list.navigated', trigger: 'click' });
    onProjectSelect?.(projectName);
    navigate(`/projects/${projectName}`);
  }, [projectName, navigate, onProjectSelect, setRememberedProject, telemetry, setAsDefaultRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNavigate();
      }
    },
    [handleNavigate],
  );

  const handleFooterClick = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);
  const handleFooterKeyDown = useCallback((e: React.KeyboardEvent) => e.stopPropagation(), []);
  const handleRibbonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(true);
  }, []);
  const handleRibbonKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setPopoverOpen(true);
    }
  }, []);

  return (
    <>
      <div
        aria-label={t('ProjectCard.openProject', { name: displayName ?? projectName })}
        className={styles.card}
        role="button"
        style={{ '--ribbon-bg': ribbonBg, '--ribbon-text': ribbonText } as React.CSSProperties}
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
      >
        {/* Clickable area over the ribbon corner — no clip, just covers the triangle zone */}
        <button
          aria-label={purposeLabel(t, supportLandscape)}
          className={styles.ribbonButton}
          id={ribbonId}
          tabIndex={-1}
          title={purposeLabel(t, supportLandscape)}
          onClick={handleRibbonClick}
          onKeyDown={handleRibbonKeyDown}
        />
        {/* Rotated label rendered on the card, outside the clipped button */}
        <span aria-hidden className={styles.ribbonLabel}>
          {purposeLabel(t, supportLandscape)}
        </span>

        <div className={styles.cardHeader}>
          <div className={styles.titleSection}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{displayName ?? projectName}</span>
              <CopyButton collapsible source="project-namespace" text={projectnameToNamespace(projectName)} />
            </div>
            {isLoading ? (
              <div className={styles.skeletonLine} />
            ) : (
              <span className={styles.subtitle}>{displayName ? projectName : ''}</span>
            )}
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.membersRow}>
            {isLoading ? (
              <div className={styles.membersSkeleton}>
                <div className={styles.avatarSkeleton} />
                <div className={styles.avatarSkeleton} />
                <div className={styles.avatarSkeleton} />
              </div>
            ) : (
              <MembersAvatarView hideNamespaceColumn members={members} project={projectName} source="project-list" />
            )}
          </div>
        </div>

        <div
          className={styles.cardFooter}
          role="presentation"
          onClick={handleFooterClick}
          onKeyDown={handleFooterKeyDown}
        >
          <div className={styles.footerLeft}>
            <YamlViewButton resourceName={projectName} resourceType="projects" variant="loader" />
            <ProjectsListItemMenu projectName={projectName} />
          </div>
          {creationTimestamp && (
            <span className={styles.footerRight} title={new Date(creationTimestamp).toLocaleString()}>
              {formatDateAsTimeAgo(creationTimestamp)}
            </span>
          )}
        </div>
      </div>

      {popoverOpen && (
        <ProjectSupportInfoPopover
          opener={ribbonId}
          open={popoverOpen}
          supportLandscape={supportLandscape}
          supportOpsContacts={supportOpsContacts}
          supportSecurityContacts={supportSecurityContacts}
          supportServiceIds={supportServiceIds}
          onClose={() => setPopoverOpen(false)}
          onEditClick={() => setEditOpen(true)}
        />
      )}
      {editOpen && (
        <EditProjectDialogContainer
          isOpen={editOpen}
          projectName={projectName}
          setIsOpen={setEditOpen}
          initialStep="supportInfo"
          source="metadata-popover"
        />
      )}
    </>
  );
}
