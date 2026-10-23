import * as Sentry from '@sentry/react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/download';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/information';
import '@ui5/webcomponents-icons/dist/nav-back';
import '@ui5/webcomponents-icons/dist/overflow';
import '@ui5/webcomponents-icons/dist/upload';
import {
  Avatar,
  Button,
  ButtonDomRef,
  Label,
  List,
  ListItemStandard,
  ListItemStandardDomRef,
  Menu,
  MenuDomRef,
  MenuItem,
  Popover,
  PopoverDomRef,
  ShellBar,
  ShellBarDomRef,
  ShellBarSpacer,
  Switch,
  Text,
  TextAreaDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { ListItemBaseClickEventDetail } from '@ui5/webcomponents/dist/ListItemBase.js';
import { TextAreaInputEventDetail } from '@ui5/webcomponents/dist/TextArea.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { RefObject, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SapLogo from '../../assets/images/sap-logo.svg';
import { Routes } from '../../Routes.ts';
import { useShellBarMcpActions } from '../../context/ShellBarMcpActionsContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useViewMode } from '../../context/ViewModeContext.tsx';
import { useYamlApply } from '../../context/YamlApplyContext.tsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useRememberedProject } from '../../hooks/useRememberedProject.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import { useAuthOnboarding as _useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { convertRoleBindingsToMembers } from '../../utils/convertRoleBindingsToMembers.ts';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';
import { DownloadKubeconfig } from '../ControlPlanes/CopyKubeconfigButton.tsx';
import { MembersAvatarView } from '../ControlPlanes/List/MembersAvatarView.tsx';
import MCPHealthPopoverButton from '../ControlPlane/MCPHealthPopoverButton.tsx';
import { avatarColorSchemeForEmail, generateInitialsForEmail } from '../Helper/generateInitialsForEmail.ts';
import { FeedbackPopover } from './FeedbackButton.tsx';
import styles from './ShellBar.module.css';

export function ShellBarComponent({
  useAuthOnboarding = _useAuthOnboarding,
}: {
  useAuthOnboarding?: typeof _useAuthOnboarding;
} = {}) {
  const auth = useAuthOnboarding();
  const { t } = useTranslation();
  const profilePopoverRef = useRef<PopoverDomRef>(null);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const infoButtonRef = useRef<ButtonDomRef | null>(null);
  const infoPopoverRef = useRef<PopoverDomRef>(null);
  const [infoPopoverOpen, setInfoPopoverOpen] = useState(false);
  const { mode, setMode, headlampAvailable } = useViewMode();
  const telemetry = useTelemetry();
  const { navigateBack, mcpName, mcpDisplayName, project, workspace, mcpStatus } = useShellBarMcpActions();

  const onLogoClick = () => {
    window.location.hash = Routes.Home;
  };

  const onProfileClick = (e: Ui5CustomEvent<ShellBarDomRef, ShellBarProfileClickEventDetail>) => {
    if (!profilePopoverRef.current) return;
    profilePopoverRef.current.opener = e.detail.targetRef;
    setProfilePopoverOpen(!profilePopoverOpen);
  };

  const handleInfoClick = () => {
    if (infoPopoverRef.current && infoButtonRef.current) {
      infoPopoverRef.current.opener = infoButtonRef.current;
      setInfoPopoverOpen((prev) => !prev);
    }
  };

  return (
    <>
      <ShellBar
        hidden={window.location.href.includes('compact-mode')}
        logo={<img src={SapLogo} alt="SAP" className={styles.logo} />}
        primaryTitle={mcpDisplayName ?? mcpName ?? 'OpenControlPlane UI'}
        profile={
          <Avatar
            colorScheme={avatarColorSchemeForEmail(auth.user?.email)}
            initials={generateInitialsForEmail(auth.user?.email)}
            size="XS"
          />
        }
        startButton={
          navigateBack ? (
            <Button
              icon="nav-back"
              accessibleName={t('ShellBar.backButton')}
              tooltip={t('ShellBar.backButton')}
              onClick={navigateBack}
            />
          ) : undefined
        }
        content={[
          ...(mcpName && mcpStatus && project && workspace
            ? [
                <MCPHealthPopoverButton
                  key="status"
                  mcpStatus={mcpStatus}
                  projectName={project}
                  workspaceName={workspace}
                  mcpName={mcpName}
                  source="detail"
                />,
              ]
            : []),
          ...(mcpName
            ? [
                <Button
                  key="info"
                  ref={infoButtonRef}
                  design="Transparent"
                  icon="information"
                  tooltip={t('ShellBar.controlPlaneInfoButton')}
                  onClick={handleInfoClick}
                />,
              ]
            : []),
          <ShellBarSpacer key="spacer" />,
          <div key="content" className={styles.shellBarContent}>
            <UploadYamlShellBarButton />
            {mode === 'open-source' && <OverflowMenuButton />}
            {mcpName && (
              <div className={styles.switchWrapper}>
                <span className={styles.switchLabel}>{t('ShellBar.modeOpenSource')}</span>
                <Switch
                  checked={mode === 'open-source'}
                  disabled={!headlampAvailable}
                  onChange={(e) => {
                    const next = e.target.checked ? 'open-source' : 'beginner';
                    setMode(next);
                    telemetry.track({
                      category: 'view-mode',
                      action: 'toggled',
                      mode: next === 'open-source' ? 'headlamp' : 'legacy',
                    });
                  }}
                />
              </div>
            )}
          </div>,
        ]}
        onLogoClick={onLogoClick}
        onProfileClick={onProfileClick}
      />

      <ProfilePopover
        open={profilePopoverOpen}
        setOpen={setProfilePopoverOpen}
        popoverRef={profilePopoverRef}
        useAuthOnboarding={useAuthOnboarding}
      />
      <ControlPlaneInfoPopover ref={infoPopoverRef} open={infoPopoverOpen} setOpen={setInfoPopoverOpen} />
    </>
  );
}

function ControlPlaneInfoPopover({
  ref,
  open,
  setOpen,
}: {
  ref: RefObject<PopoverDomRef | null>;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { mcpName, mcpDisplayName, project, workspace, mcpCreationTimestamp, mcpCreatedBy, roleBindings, kubeconfig } =
    useShellBarMcpActions();
  const { t } = useTranslation();
  const { mode } = useViewMode();

  if (!mcpName) return null;

  const created = mcpCreationTimestamp
    ? new Date(mcpCreationTimestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : undefined;

  const members = roleBindings ? convertRoleBindingsToMembers(roleBindings) : [];
  const hasKubeconfig = mode === 'open-source' && !!kubeconfig && !!mcpName;

  return (
    <Popover
      ref={ref}
      placement={PopoverPlacement.Bottom}
      open={open}
      headerText={mcpDisplayName ?? mcpName}
      onClose={() => setOpen(false)}
    >
      <div className={styles.infoPopoverContent}>
        <div className={styles.infoGrid}>
          {project && (
            <>
              <Label>{t('Entities.Project')}</Label>
              <Text>{project}</Text>
            </>
          )}
          {workspace && (
            <>
              <Label>{t('Entities.Workspace')}</Label>
              <Text>{workspace}</Text>
            </>
          )}
          {created && (
            <>
              <Label>{t('McpHeader.createdOnLabel')}</Label>
              <Text>
                {created} ({formatDateAsTimeAgo(mcpCreationTimestamp!)})
              </Text>
            </>
          )}
          {mcpCreatedBy && (
            <>
              <Label>{t('McpHeader.createdByLabel')}</Label>
              <Text>{mcpCreatedBy}</Text>
            </>
          )}
        </div>

        {members.length > 0 && (
          <div className={styles.infoSection}>
            <Label>
              {t('common.members')} ({members.length})
            </Label>
            <MembersAvatarView members={members} hideNamespaceColumn source="controlplane-detail" />
          </div>
        )}

        {hasKubeconfig && (
          <div className={styles.infoSection}>
            <Label>{t('CopyKubeconfigButton.kubeconfigButton')}</Label>
            <KubeconfigPopoverButtons kubeconfig={kubeconfig!} mcpName={mcpName} />
          </div>
        )}
      </div>
    </Popover>
  );
}

function KubeconfigPopoverButtons({ kubeconfig, mcpName }: { kubeconfig: string; mcpName: string }) {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();
  const telemetry = useTelemetry();

  return (
    <div className={styles.kubeconfigButtons}>
      <Button
        design="Default"
        icon="download"
        onClick={() => {
          DownloadKubeconfig(kubeconfig, mcpName);
          telemetry.track({ category: 'kubeconfig', action: 'downloaded', source: 'controlplane-info-popover' });
        }}
      >
        {t('CopyKubeconfigButton.menuDownload')}
      </Button>
      <Button
        design="Default"
        icon="copy"
        onClick={() => {
          void copyToClipboard(kubeconfig);
          telemetry.track({ category: 'kubeconfig', action: 'copied', source: 'controlplane-info-popover' });
        }}
      >
        {t('CopyKubeconfigButton.menuCopy')}
      </Button>
    </div>
  );
}

function OverflowMenuButton() {
  const { onEditMcp, onOpenYaml } = useShellBarMcpActions();
  const { t } = useTranslation();
  const menuRef = useRef<MenuDomRef | null>(null);
  const buttonRef = useRef<ButtonDomRef | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!onEditMcp && !onOpenYaml) return null;

  return (
    <>
      <Button
        ref={buttonRef}
        design="Transparent"
        icon="overflow"
        onClick={() => {
          if (menuRef.current && buttonRef.current) {
            menuRef.current.opener = buttonRef.current;
            setMenuOpen((prev) => !prev);
          }
        }}
      />
      <Menu
        ref={menuRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onItemClick={(event) => {
          const action = event.detail.item.dataset.action;
          if (action === 'edit') onEditMcp?.();
          else if (action === 'yaml') onOpenYaml?.();
          setMenuOpen(false);
        }}
      >
        {onEditMcp && <MenuItem text={t('ShellBar.overflowEditMcp')} data-action="edit" icon="edit" />}
        {onOpenYaml && <MenuItem text={t('ShellBar.overflowViewYaml')} data-action="yaml" icon="source-code" />}
      </Menu>
    </>
  );
}

const ProfilePopover = ({
  open,
  setOpen,
  popoverRef,
  useAuthOnboarding = _useAuthOnboarding,
}: {
  open: boolean;
  setOpen: (arg0: boolean) => void;
  popoverRef: RefObject<PopoverDomRef | null>;
  useAuthOnboarding?: typeof _useAuthOnboarding;
}) => {
  const auth = useAuthOnboarding();
  const telemetry = useTelemetry();
  const { t } = useTranslation();
  const feedbackPopoverRef = useRef<PopoverDomRef>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackPopoverOpen, setFeedbackPopoverOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const { rememberedProject, clearRememberedProject } = useRememberedProject();
  const hasRememberedProject = rememberedProject !== null;
  const toast = useToast();

  const onFeedbackMessageChange = (event: Ui5CustomEvent<TextAreaDomRef, TextAreaInputEventDetail>) => {
    const newValue = event.target.value;
    setFeedbackMessage(newValue);
  };

  async function onFeedbackSent() {
    const payload = {
      message: feedbackMessage,
      rating: rating.toString(),
    };
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.show(data?.message ?? data?.error ?? t('ShellBar.feedbackError'));
        return;
      }

      setFeedbackSent(true);
      telemetry.track({ category: 'feedback', action: 'submitted' });
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          context: 'FeedbackButton',
        },
      });
      toast.show(t('ShellBar.feedbackError'));
    }
  }

  const handleFeedbackClick = (e: Ui5CustomEvent<ListItemStandardDomRef, ListItemBaseClickEventDetail>) => {
    if (!feedbackPopoverRef.current || !popoverRef.current) return;
    e.stopPropagation();
    setOpen(false);
    feedbackPopoverRef.current.opener = popoverRef.current.opener;
    setFeedbackMessage('');
    setRating(0);
    setFeedbackSent(false);
    setFeedbackPopoverOpen(true);
    telemetry.track({ category: 'feedback', action: 'opened' });
  };

  return (
    <>
      <Popover
        ref={popoverRef}
        placement={PopoverPlacement.Bottom}
        open={open}
        headerText={t('ShellBar.hello', { name: auth.user?.email?.split('@')[0] ?? '' })}
        onClose={() => setOpen(false)}
      >
        <List>
          <ListItemStandard icon="feedback" onClick={handleFeedbackClick}>
            {t('ShellBar.feedbackButtonInfo')}
          </ListItemStandard>
          {hasRememberedProject && (
            <ListItemStandard
              icon="bookmark"
              onClick={() => {
                clearRememberedProject();
                telemetry.track({ category: 'project', action: 'remembered-cleared', source: 'shellbar-menu' });
                setOpen(false);
              }}
            >
              {t('ShellBar.clearRememberedProject')}
            </ListItemStandard>
          )}
          <ListItemStandard
            icon="log"
            onClick={() => {
              setOpen(false);
              telemetry.track({ category: 'user', action: 'signed-out' });
              void auth.logout();
            }}
          >
            {t('ShellBar.signOutButton')}
          </ListItemStandard>
        </List>
      </Popover>
      <FeedbackPopover
        open={feedbackPopoverOpen}
        setOpen={setFeedbackPopoverOpen}
        popoverRef={feedbackPopoverRef}
        setRating={setRating}
        rating={rating}
        feedbackMessage={feedbackMessage}
        feedbackSent={feedbackSent}
        onFeedbackSent={onFeedbackSent}
        onFeedbackMessageChange={onFeedbackMessageChange}
      />
    </>
  );
};

function UploadYamlShellBarButton() {
  const { requestApplyFiles } = useYamlApply();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".yaml,.yml"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) requestApplyFiles(files);
          e.target.value = '';
        }}
      />
      <Button
        design="Transparent"
        icon="upload"
        tooltip={t('yamlApply.uploadButton')}
        onClick={() => inputRef.current?.click()}
      >
        {t('yamlApply.uploadButtonShort')}
      </Button>
    </>
  );
}
