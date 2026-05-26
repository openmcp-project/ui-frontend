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
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { RefObject, useRef, useState } from 'react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { generateInitialsForEmail } from '../Helper/generateInitialsForEmail.ts';
import SapLogo from '../../assets/images/sap-logo.svg';
import styles from './ShellBar.module.css';
import { useViewMode } from '../../context/ViewModeContext.tsx';
import { useShellBarMcpActions } from '../../context/ShellBarMcpActionsContext.tsx';
import { DownloadKubeconfig } from '../ControlPlanes/CopyKubeconfigButton.tsx';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/download';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/nav-back';
import '@ui5/webcomponents-icons/dist/source-code';
import '@ui5/webcomponents-icons/dist/add-document';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { MembersAvatarView } from '../ControlPlanes/List/MembersAvatarView.tsx';
import { convertRoleBindingsToMembers } from '../../utils/convertRoleBindingsToMembers.ts';

export function ShellBarComponent() {
  const auth = useAuthOnboarding();
  const profilePopoverRef = useRef<PopoverDomRef>(null);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const { mode, setMode } = useViewMode();
  const { t } = useTranslation();
  const { roleBindings, project, workspace, navigateBack, mcpName } = useShellBarMcpActions();

  const onProfileClick = (e: Ui5CustomEvent<ShellBarDomRef, ShellBarProfileClickEventDetail>) => {
    profilePopoverRef.current!.opener = e.detail.targetRef;
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
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <span className={styles.logoText}>ManagedControlPlane UI</span>
            </div>
          </div>
        }
        onProfileClick={onProfileClick}
      >
        <div className={styles.shellBarContent}>
          {roleBindings && (
            <div className={styles.membersSlot}>
              <MembersAvatarView
                members={convertRoleBindingsToMembers(roleBindings)}
                project={project}
                workspace={workspace}
                hideNamespaceColumn
              />
            </div>
          )}
          <KubeconfigShellBarButton />
          {mcpName && (
            <div className={styles.switchWrapper}>
              <span className={styles.switchLabel}>{t('ShellBar.modeOpenSource')}</span>
              <Switch
                checked={mode === 'open-source'}
                onChange={(e) => setMode(e.target.checked ? 'open-source' : 'beginner')}
              />
            </div>
          )}
        </div>
      </ShellBar>

      <ProfilePopover open={profilePopoverOpen} setOpen={setProfilePopoverOpen} popoverRef={profilePopoverRef} />
    </>
  );
}

function KubeconfigShellBarButton() {
  const { kubeconfig, mcpName, namespace, onEditMcp, onOpenYaml } = useShellBarMcpActions();
  const { mode } = useViewMode();
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();
  const kubeconfigMenuRef = useRef<MenuDomRef | null>(null);
  const buttonRef = useRef<ButtonDomRef | null>(null);
  const overflowMenuRef = useRef<MenuDomRef | null>(null);
  const overflowButtonRef = useRef<ButtonDomRef | null>(null);
  const [kubeconfigMenuOpen, setKubeconfigMenuOpen] = useState(false);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);

  const hasKubeconfig = mode === 'open-source' && !!kubeconfig && !!mcpName;
  const hasActions = hasKubeconfig || !!onEditMcp || !!namespace;
  const hasOverflow = !!onEditMcp || !!onOpenYaml;

  if (!hasActions && !hasOverflow) return null;

  const handleButtonClick = () => {
    if (kubeconfigMenuRef.current && buttonRef.current) {
      kubeconfigMenuRef.current.opener = buttonRef.current;
      setKubeconfigMenuOpen((prev) => !prev);
    }
  };

  const handleOverflowClick = () => {
    if (overflowMenuRef.current && overflowButtonRef.current) {
      overflowMenuRef.current.opener = overflowButtonRef.current;
      setOverflowMenuOpen((prev) => !prev);
    }
  };

  return (
    <>
      {hasActions && (
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
              } else if (action === 'copy' && kubeconfig) {
                void copyToClipboard(kubeconfig);
              } else if (action === 'copy-namespace' && namespace) {
                void copyToClipboard(namespace);
              }
              setKubeconfigMenuOpen(false);
            }}
          >
            {hasKubeconfig && (
              <MenuItem text={t('CopyKubeconfigButton.menuDownload')} data-action="download" icon="download" />
            )}
            {hasKubeconfig && <MenuItem text={t('CopyKubeconfigButton.menuCopy')} data-action="copy" icon="copy" />}
            {namespace && <MenuItem text={t('ShellBar.copyNamespace')} data-action="copy-namespace" icon="copy" />}
          </Menu>
        </>
      )}
      {hasOverflow && (
        <>
          <Button
            ref={overflowButtonRef}
            design="Transparent"
            icon="overflow"
            onClick={handleOverflowClick}
          />
          <Menu
            ref={overflowMenuRef}
            open={overflowMenuOpen}
            onClose={() => setOverflowMenuOpen(false)}
            onItemClick={(event) => {
              const action = event.detail.item.dataset.action;
              if (action === 'edit') {
                onEditMcp?.();
              } else if (action === 'yaml') {
                onOpenYaml?.();
              }
              setOverflowMenuOpen(false);
            }}
          >
            {onEditMcp && <MenuItem text={t('ShellBar.overflowEditMcp')} data-action="edit" icon="edit" />}
            {onOpenYaml && <MenuItem text={t('ShellBar.overflowViewYaml')} data-action="yaml" icon="source-code" />}
            <MenuItem text={t('ShellBar.overflowConnectGitRepo')} data-action="connect-git" icon="add-document" disabled />
          </Menu>
        </>
      )}
    </>
  );
}

const ProfilePopover = ({
  open,
  setOpen,
  popoverRef,
}: {
  open: boolean;
  setOpen: (arg0: boolean) => void;
  popoverRef: RefObject<PopoverDomRef | null>;
}) => {
  const auth = useAuthOnboarding();
  const { t } = useTranslation();

  return (
    <Popover
      ref={popoverRef}
      placement={PopoverPlacement.Bottom}
      open={open}
      headerText="Profile"
      onClose={() => setOpen(false)}
    >
      <List>
        <ListItemStandard
          icon="log"
          onClick={() => {
            setOpen(false);
            void auth.logout();
          }}
        >
          {t('ShellBar.signOutButton')}
        </ListItemStandard>
      </List>
    </Popover>
  );
};
