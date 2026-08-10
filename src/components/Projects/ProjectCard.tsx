import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@ui5/webcomponents-icons/dist/badge.js';
import '@ui5/webcomponents-icons/dist/hint.js';
import { Button, Icon, Popover } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { isKnownLandscape, purposeIndicationVars, purposeLabel, purposeShortLabel } from '../../lib/supportInfo.ts';
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
  const infoButtonId = useId();

  const {
    members,
    displayName,
    createdBy,
    creationTimestamp,
    supportLandscape,
    supportServiceIds,
    supportSecurityContacts,
    supportOpsContacts,
    isLoading,
  } = useProjectMembers(projectName);

  const [supportPopoverOpen, setSupportPopoverOpen] = useState(false);
  const [infoPopoverOpen, setInfoPopoverOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) onPurposeResolved?.(projectName, supportLandscape);
  }, [isLoading, supportLandscape, projectName, onPurposeResolved]);

  useEffect(() => {
    if (!isLoading) onDisplayNameResolved?.(projectName, displayName);
  }, [isLoading, displayName, projectName, onDisplayNameResolved]);

  useEffect(() => {
    if (!isLoading) onTimestampResolved?.(projectName, creationTimestamp);
  }, [isLoading, creationTimestamp, projectName, onTimestampResolved]);

  const hasPurpose = isKnownLandscape(supportLandscape);
  const { bg: ribbonBg, text: ribbonText, hoverBg: ribbonHoverBg } = purposeIndicationVars(supportLandscape);

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
  const handleRibbonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasPurpose) {
        setSupportPopoverOpen(true);
      } else {
        setEditOpen(true);
      }
    },
    [hasPurpose],
  );
  const handleRibbonKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (hasPurpose) {
          setSupportPopoverOpen(true);
        } else {
          setEditOpen(true);
        }
      }
    },
    [hasPurpose],
  );

  return (
    <>
      <div
        aria-label={t('ProjectCard.openProject', { name: displayName ?? projectName })}
        className={styles.card}
        role="button"
        style={
          hasPurpose
            ? ({
                '--ribbon-bg': ribbonBg,
                '--ribbon-hover-bg': ribbonHoverBg,
                '--ribbon-text': ribbonText,
              } as React.CSSProperties)
            : undefined
        }
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
      >
        {/* Ribbon wrapper — clip-path clips children including rotated text */}
        {hasPurpose && (
          <button
            aria-label={purposeLabel(t, supportLandscape)}
            className={styles.ribbonWrap}
            id={ribbonId}
            tabIndex={-1}
            title={purposeLabel(t, supportLandscape)}
            onClick={handleRibbonClick}
            onKeyDown={handleRibbonKeyDown}
          >
            <span aria-hidden className={styles.ribbonBg} />
            <span aria-hidden className={styles.ribbonLabelContainer}>
              <span className={styles.ribbonLabel}>{purposeShortLabel(t, supportLandscape)}</span>
            </span>
          </button>
        )}

        {!hasPurpose && (
          <button
            aria-label={t('ProjectCard.setPurpose')}
            className={styles.ribbonWrapUnset}
            id={ribbonId}
            tabIndex={-1}
            title={t('ProjectCard.setPurpose')}
            onClick={handleRibbonClick}
            onKeyDown={handleRibbonKeyDown}
          >
            <svg
              aria-hidden
              className={styles.ribbonSvg}
              fill="none"
              viewBox="0 0 56 56"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                stroke="var(--sapButton_Emphasized_Background)"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeWidth="2"
                x1="0"
                x2="56"
                y1="0"
                y2="56"
              />
            </svg>
            <Icon aria-hidden className={styles.ribbonIcon} name="badge" />
          </button>
        )}

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

        {/* Single compact footer: members · spacer · info · yaml · menu */}
        <div
          className={styles.cardFooter}
          role="presentation"
          onClick={handleFooterClick}
          onKeyDown={handleFooterKeyDown}
        >
          <div className={styles.footerMembers}>
            {isLoading ? (
              <div className={styles.membersSkeleton}>
                <div className={styles.avatarSkeleton} />
                <div className={styles.avatarSkeleton} />
              </div>
            ) : (
              <MembersAvatarView hideNamespaceColumn members={members} project={projectName} source="project-list" />
            )}
          </div>
          <div className={styles.footerActions}>
            <Button
              className={styles.infoButton}
              design="Transparent"
              icon="hint"
              id={infoButtonId}
              tooltip={t('ProjectCard.infoButton')}
              onClick={() => setInfoPopoverOpen(true)}
            />
            <YamlViewButton resourceName={projectName} resourceType="projects" variant="loader" />
            <ProjectsListItemMenu projectName={projectName} />
          </div>
        </div>
      </div>

      {/* Info popover: created at + created by */}
      <Popover
        opener={infoButtonId}
        open={infoPopoverOpen}
        placement={PopoverPlacement.Bottom}
        onClose={() => setInfoPopoverOpen(false)}
      >
        <div className={styles.infoPopover}>
          {creationTimestamp && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('ProjectCard.createdAt')}</span>
              <span className={styles.infoValue} title={new Date(creationTimestamp).toLocaleString()}>
                {formatDateAsTimeAgo(creationTimestamp)}
              </span>
            </div>
          )}
          {createdBy && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('ProjectCard.createdBy')}</span>
              <span className={styles.infoValue}>{createdBy}</span>
            </div>
          )}
        </div>
      </Popover>

      {supportPopoverOpen && (
        <ProjectSupportInfoPopover
          opener={ribbonId}
          open={supportPopoverOpen}
          supportLandscape={supportLandscape}
          supportOpsContacts={supportOpsContacts}
          supportSecurityContacts={supportSecurityContacts}
          supportServiceIds={supportServiceIds}
          onClose={() => setSupportPopoverOpen(false)}
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
