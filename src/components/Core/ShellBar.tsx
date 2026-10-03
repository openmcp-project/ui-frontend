import * as Sentry from '@sentry/react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/download';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/information';
import '@ui5/webcomponents-icons/dist/nav-back';
import {
  Avatar,
  Bar,
  Button,
  ButtonDomRef,
  FlexBox,
  Icon,
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
  Tag,
  Text,
  TextAreaDomRef,
  Title,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { ListItemBaseClickEventDetail } from '@ui5/webcomponents/dist/ListItemBase.js';
import { TextAreaInputEventDetail } from '@ui5/webcomponents/dist/TextArea.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { ReactNode, RefObject, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SapLogo from '../../assets/images/sap-logo.svg';
import { Routes } from '../../Routes.ts';
import { useShellBarMcpActions, type McpStatusInfo } from '../../context/ShellBarMcpActionsContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useViewMode } from '../../context/ViewModeContext.tsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useRememberedProject } from '../../hooks/useRememberedProject.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import { useAuthOnboarding as _useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { convertRoleBindingsToMembers } from '../../utils/convertRoleBindingsToMembers.ts';
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
  const { mode, setMode, headlampAvailable } = useViewMode();
  const telemetry = useTelemetry();
  const {
    roleBindings,
    navigateBack,
    mcpName,
    mcpDisplayName,
    mcpKind,
    mcpCreationTimestamp,
    mcpCreatedBy,
    mcpNamespace,
    mcpStatus,
    project,
    workspace,
    onEditMcp,
    onDeleteMcp,
  } = useShellBarMcpActions();

  const shellBarRef = useRef<ShellBarDomRef>(null);
  const mcpInfoPopoverRef = useRef<PopoverDomRef>(null);
  const [mcpInfoPopoverOpen, setMcpInfoPopoverOpen] = useState(false);

  const onProfileClick = (e: Ui5CustomEvent<ShellBarDomRef, ShellBarProfileClickEventDetail>) => {
    if (!profilePopoverRef.current) return;
    profilePopoverRef.current.opener = e.detail.targetRef;
    setProfilePopoverOpen(!profilePopoverOpen);
  };

  return (
    <>
      <ShellBar
        ref={shellBarRef}
        hidden={window.location.href.includes('compact-mode')}
        logo={
          <div className={styles.logoSlot}>
            <img src={SapLogo} alt="SAP" className={styles.logo} />
            {mcpName && (
              <>
                <span className={styles.shellBarCpName}>{mcpDisplayName || mcpName}</span>
                <Icon name="information" className={styles.mcpInfoHint} />
              </>
            )}
          </div>
        }
        primaryTitle={mcpName ? '' : 'OpenControlPlane UI'}
        onLogoClick={() => {
          if (mcpName) {
            if (mcpInfoPopoverRef.current && shellBarRef.current) {
              mcpInfoPopoverRef.current.opener = shellBarRef.current.logoDomRef as HTMLElement;
            }
            setMcpInfoPopoverOpen(true);
          } else {
            window.location.hash = Routes.Home;
          }
        }}
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
          <ShellBarSpacer key="spacer" />,
          <div key="content" className={styles.shellBarContent}>
            <KubeconfigShellBarButton />
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
        onProfileClick={onProfileClick}
      />

      <ProfilePopover
        open={profilePopoverOpen}
        setOpen={setProfilePopoverOpen}
        popoverRef={profilePopoverRef}
        useAuthOnboarding={useAuthOnboarding}
      />

      {mcpName && (
        <Popover
          ref={mcpInfoPopoverRef}
          placement={PopoverPlacement.Bottom}
          header={
            <Bar
              startContent={
                <Title level="H5" wrappingType="None">
                  {mcpDisplayName || mcpName}
                </Title>
              }
            />
          }
          footer={
            onEditMcp || onDeleteMcp ? (
              <Bar
                design="Footer"
                startContent={
                  onDeleteMcp ? (
                    <Button
                      design="Transparent"
                      icon="delete"
                      onClick={() => {
                        setMcpInfoPopoverOpen(false);
                        onDeleteMcp();
                      }}
                    >
                      {t('ShellBar.deleteMcp')}
                    </Button>
                  ) : undefined
                }
                endContent={
                  onEditMcp ? (
                    <Button
                      design="Transparent"
                      icon="edit"
                      onClick={() => {
                        setMcpInfoPopoverOpen(false);
                        onEditMcp();
                      }}
                    >
                      {t('ShellBar.overflowEditMcp')}
                    </Button>
                  ) : undefined
                }
              />
            ) : undefined
          }
          open={mcpInfoPopoverOpen}
          onClose={() => setMcpInfoPopoverOpen(false)}
        >
          <McpInfoPopoverContent
            mcpName={mcpName}
            mcpKind={mcpKind}
            mcpCreationTimestamp={mcpCreationTimestamp}
            mcpCreatedBy={mcpCreatedBy}
            mcpNamespace={mcpNamespace}
            mcpStatus={mcpStatus}
            projectName={project}
            workspaceName={workspace}
            roleBindings={roleBindings}
          />
        </Popover>
      )}
    </>
  );
}

function KubeconfigShellBarButton() {
  const { kubeconfig, mcpName } = useShellBarMcpActions();
  const { mode } = useViewMode();
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();
  const telemetry = useTelemetry();
  const kubeconfigMenuRef = useRef<MenuDomRef | null>(null);
  const buttonRef = useRef<ButtonDomRef | null>(null);
  const [kubeconfigMenuOpen, setKubeconfigMenuOpen] = useState(false);

  const hasKubeconfig = mode === 'open-source' && !!kubeconfig && !!mcpName;

  if (!hasKubeconfig) return null;

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
            telemetry.track({ category: 'kubeconfig', action: 'downloaded', source: 'controlplane-shellbar' });
          } else if (action === 'copy' && kubeconfig) {
            void copyToClipboard(kubeconfig);
            telemetry.track({ category: 'kubeconfig', action: 'copied', source: 'controlplane-shellbar' });
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

function McpInfoPopoverContent({
  mcpName,
  mcpKind,
  mcpCreationTimestamp,
  mcpCreatedBy,
  mcpNamespace,
  mcpStatus,
  projectName,
  workspaceName,
  roleBindings,
}: {
  mcpName: string;
  mcpKind?: string;
  mcpCreationTimestamp?: string;
  mcpCreatedBy?: string;
  mcpNamespace?: string;
  mcpStatus?: McpStatusInfo | null;
  projectName?: string;
  workspaceName?: string;
  roleBindings?: import('../../context/ShellBarMcpActionsContext.tsx').McpActions['roleBindings'];
}) {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();
  const members = roleBindings ? convertRoleBindingsToMembers(roleBindings) : undefined;

  const created = mcpCreationTimestamp
    ? new Date(mcpCreationTimestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : undefined;

  const isDeprecated = mcpKind === 'ManagedControlPlane';

  const hasStatus = !!(mcpStatus && projectName && workspaceName);
  const hasMembers = !!(members && members.length > 0);

  return (
    <FlexBox direction="Column" style={{ gap: '0.75rem', padding: '0.25rem 0', minWidth: '20rem' }}>
      <McpInfoField label={t('McpHeader.nameLabel')}>
        <Text>{mcpName}</Text>
      </McpInfoField>

      {mcpKind && (
        <McpInfoField label={t('ShellBar.kindLabel')}>
          <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
            <Text>{mcpKind}</Text>
            {isDeprecated && (
              <Tag design="Set2" colorScheme="2" hideStateIcon>
                {t('ShellBar.deprecatedBadge')}
              </Tag>
            )}
          </FlexBox>
        </McpInfoField>
      )}

      {(created || mcpCreatedBy) && (
        <FlexBox direction="Row" wrap="NoWrap" style={{ gap: '1.5rem' }}>
          {created && (
            <McpInfoField label={t('McpHeader.createdOnLabel')}>
              <Text>{created}</Text>
            </McpInfoField>
          )}
          {mcpCreatedBy && (
            <McpInfoField label={t('McpHeader.createdByLabel')}>
              <Text>{mcpCreatedBy}</Text>
            </McpInfoField>
          )}
        </FlexBox>
      )}

      {mcpNamespace && (
        <McpInfoField label={t('ShellBar.namespaceLabel')}>
          <FlexBox alignItems="Center" style={{ gap: '0.25rem' }}>
            <Text
              style={{ fontFamily: 'var(--sapFontMonospaceFamily, monospace)', wordBreak: 'break-all' }}
            >
              {mcpNamespace}
            </Text>
            <Button
              design="Transparent"
              icon="copy"
              tooltip={t('ShellBar.copyNamespace')}
              onClick={() => void copyToClipboard(mcpNamespace)}
            />
          </FlexBox>
        </McpInfoField>
      )}

      {(hasStatus || hasMembers) && (
        <FlexBox direction="Row" wrap="NoWrap" style={{ gap: '1.5rem' }}>
          {hasStatus && (
            <McpInfoField label={t('common.status')}>
              <MCPHealthPopoverButton
                mcpStatus={mcpStatus}
                projectName={projectName!}
                workspaceName={workspaceName!}
                mcpName={mcpName}
                source="detail"
              />
            </McpInfoField>
          )}
          {hasMembers && (
            <McpInfoField label={t('ShellBar.membersLabel')}>
              <MembersAvatarView members={members!} hideNamespaceColumn source="controlplane-detail" />
            </McpInfoField>
          )}
        </FlexBox>
      )}
    </FlexBox>
  );
}

function McpInfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <FlexBox direction="Column" style={{ gap: '0.125rem', flex: 1, minWidth: 0 }}>
      <Label>{label}</Label>
      {children}
    </FlexBox>
  );
}
