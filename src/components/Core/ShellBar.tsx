import * as Sentry from '@sentry/react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/download';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/nav-back';
import '@ui5/webcomponents-icons/dist/overflow';
import '@ui5/webcomponents-icons/dist/source-code';
import {
  Avatar,
  Button,
  ButtonDomRef,
  List,
  ListItemStandard,
  Menu,
  MenuDomRef,
  MenuItem,
  Popover,
  PopoverDomRef,
  ShellBar,
  ShellBarDomRef,
  Switch,
  TextAreaDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { TextAreaInputEventDetail } from '@ui5/webcomponents/dist/TextArea.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { RefObject, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SapLogo from '../../assets/images/sap-logo.svg';
import { useShellBarMcpActions } from '../../context/ShellBarMcpActionsContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useViewMode } from '../../context/ViewModeContext.tsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useRememberedProject } from '../../hooks/useRememberedProject.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import { useAuthOnboarding as _useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { convertRoleBindingsToMembers } from '../../utils/convertRoleBindingsToMembers.ts';
import { DownloadKubeconfig } from '../ControlPlanes/CopyKubeconfigButton.tsx';
import { MembersAvatarView } from '../ControlPlanes/List/MembersAvatarView.tsx';
import { generateInitialsForEmail } from '../Helper/generateInitialsForEmail.ts';
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
  const { mode, setMode, headlampAvailable } = useViewMode();
  const telemetry = useTelemetry();
  const { roleBindings, project, workspace, navigateBack, mcpName, mcpDisplayName, namespace } =
    useShellBarMcpActions();
  const { copyToClipboard } = useCopyToClipboard();

  const onProfileClick = (e: Ui5CustomEvent<ShellBarDomRef, ShellBarProfileClickEventDetail>) => {
    if (!profilePopoverRef.current) return;
    profilePopoverRef.current.opener = e.detail.targetRef;
    setProfilePopoverOpen(!profilePopoverOpen);
  };

  return (
    <>
      <ShellBar
        className={styles.shellBar}
        hidden={window.location.href.includes('compact-mode')}
        profile={<Avatar initials={generateInitialsForEmail(auth.user?.email)} size="XS" />}
        startButton={
          <div className={styles.container}>
            {navigateBack && (
              <Button
                icon="nav-back"
                design="Transparent"
                className={styles.backButton}
                title={t('ShellBar.backButton')}
                onClick={navigateBack}
              />
            )}
            <div className={styles.logoWrapper}>
              <img src={SapLogo} alt="SAP" className={styles.logo} />
              <span className={styles.logoText}>{mcpDisplayName ?? mcpName ?? 'OpenControlPlane UI'}</span>
              {namespace && (
                <Button
                  design="Transparent"
                  icon="copy"
                  tooltip={t('ShellBar.copyNamespace')}
                  className={styles.copyNamespaceButton}
                  onClick={() => {
                    void copyToClipboard(namespace);
                    telemetry.track({ name: 'clipboard.copied', source: 'controlplane-namespace' });
                  }}
                />
              )}
            </div>
          </div>
        }
        onProfileClick={onProfileClick}
      >
        <div className={styles.shellBarContent}>
          {roleBindings && (
            <div className={styles.membersSlot}>
              <span className={styles.membersLabel}>{t('ShellBar.membersLabel')}</span>
              <MembersAvatarView
                members={convertRoleBindingsToMembers(roleBindings)}
                project={project}
                workspace={workspace}
                hideNamespaceColumn
                source="controlplane-detail"
              />
            </div>
          )}
          <KubeconfigShellBarButton />
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
                  telemetry.track({ name: 'view-mode.toggled', mode: next === 'open-source' ? 'headlamp' : 'legacy' });
                }}
              />
            </div>
          )}
        </div>
      </ShellBar>

      <ProfilePopover
        open={profilePopoverOpen}
        setOpen={setProfilePopoverOpen}
        popoverRef={profilePopoverRef}
        useAuthOnboarding={useAuthOnboarding}
      />
    </>
  );
}

function KubeconfigShellBarButton() {
  const { kubeconfig, mcpName, namespace } = useShellBarMcpActions();
  const { mode } = useViewMode();
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();
  const telemetry = useTelemetry();
  const kubeconfigMenuRef = useRef<MenuDomRef | null>(null);
  const buttonRef = useRef<ButtonDomRef | null>(null);
  const [kubeconfigMenuOpen, setKubeconfigMenuOpen] = useState(false);

  const hasKubeconfig = mode === 'open-source' && !!kubeconfig && !!mcpName;
  const hasActions = hasKubeconfig || !!namespace;

  if (!hasActions) return null;

  const handleButtonClick = () => {
    if (kubeconfigMenuRef.current && buttonRef.current) {
      kubeconfigMenuRef.current.opener = buttonRef.current;
      setKubeconfigMenuOpen((prev) => !prev);
    }
  };

  return (
    <>
      <Button
        ref={buttonRef}
        className={styles.kubeconfigButton}
        design="Emphasized"
        icon="slim-arrow-down"
        icon-end
        onClick={handleButtonClick}
      >
        {t('CopyKubeconfigButton.kubeconfigButton')}
      </Button>
      <Menu
        ref={kubeconfigMenuRef}
        open={kubeconfigMenuOpen}
        onClose={() => setKubeconfigMenuOpen(false)}
        onItemClick={(event) => {
          const action = event.detail.item.dataset.action;
          if (action === 'download' && kubeconfig && mcpName) {
            DownloadKubeconfig(kubeconfig, mcpName);
            telemetry.track({ name: 'kubeconfig.downloaded', source: 'controlplane-shellbar' });
          } else if (action === 'copy' && kubeconfig) {
            void copyToClipboard(kubeconfig);
            telemetry.track({ name: 'kubeconfig.copied', source: 'controlplane-shellbar' });
          }
          setKubeconfigMenuOpen(false);
        }}
      >
        {hasKubeconfig && (
          <MenuItem text={t('CopyKubeconfigButton.menuDownload')} data-action="download" icon="download" />
        )}
        {hasKubeconfig && <MenuItem text={t('CopyKubeconfigButton.menuCopy')} data-action="copy" icon="copy" />}
      </Menu>
    </>
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
      telemetry.track({ name: 'feedback.submitted' });
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          context: 'FeedbackButton',
        },
      });
      toast.show(t('ShellBar.feedbackError'));
    }
  }

  const handleFeedbackClick = (e: React.MouseEvent) => {
    if (!feedbackPopoverRef.current || !popoverRef.current) return;
    e.stopPropagation();
    setOpen(false);
    feedbackPopoverRef.current.opener = popoverRef.current.opener;
    setFeedbackMessage('');
    setRating(0);
    setFeedbackSent(false);
    setFeedbackPopoverOpen(true);
    telemetry.track({ name: 'feedback.opened' });
  };

  return (
    <>
      <Popover
        ref={popoverRef}
        placement={PopoverPlacement.Bottom}
        open={open}
        headerText="Profile"
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
                telemetry.track({ name: 'project.remembered-cleared', source: 'shellbar-menu' });
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
              telemetry.track({ name: 'user.signed-out' });
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
