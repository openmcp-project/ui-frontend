import {
  Avatar,
  Button,
  ButtonDomRef,
  Icon,
  List,
  ListItemStandard,
  Popover,
  PopoverDomRef,
  ShellBar,
  ShellBarDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useAuth } from 'react-oidc-context';
import { RefObject, useEffect, useRef, useState } from 'react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { generateInitialsForEmail } from '../Helper/GenerateInitialsForEmail';
import styles from './ShellBar.module.css';

export function ShellBarComponent() {
  const auth = useAuth();
  const profilePopoverRef = useRef<PopoverDomRef>(null);
  const betaPopoverRef = useRef<PopoverDomRef>(null);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [betaPopoverOpen, setBetaPopoverOpen] = useState(false);

  const betaButtonRef = useRef<ButtonDomRef>(null);

  const onProfileClick = (
    e: Ui5CustomEvent<ShellBarDomRef, ShellBarProfileClickEventDetail>,
  ) => {
    profilePopoverRef.current!.opener = e.detail.targetRef;
    setProfilePopoverOpen(!profilePopoverOpen);
  };

  const onBetaClick = () => {
    if (betaButtonRef.current) {
      betaPopoverRef.current!.opener = betaButtonRef.current;
      setBetaPopoverOpen(!betaPopoverOpen);
    }
  };

  useEffect(() => {
    const shellbar = document.querySelector('ui5-shellbar');
    const el = shellbar?.shadowRoot?.querySelector(
      '.ui5-shellbar-overflow-container-left',
    );

    if (el) {
      (el as HTMLElement).style.backgroundColor = 'red';
    }
  }, []);

  return (
    <>
      <ShellBar
        className={styles.TestShellbar}
        profile={
          <Avatar
            initials={generateInitialsForEmail(auth.user?.profile.email)}
            size="XS"
          />
        }
        startButton={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Logo + Tytuł */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <img src="/logo.png" alt="MCP" style={{ height: '1.5rem' }} />
              <span
                style={{
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  color: 'var(--sapTextColor)',
                }}
              >
                MCP
              </span>
            </div>

            {/* BETA Button */}
            <Button
              ref={betaButtonRef}
              design="Transparent"
              style={{
                backgroundColor: '#EAF4FE',
                color: '#0A6ED1',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid #D1E8FF',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                height: '1.75rem',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={onBetaClick}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem', // odstęp między ikoną a tekstem
                }}
              >
                <Icon
                  name="information"
                  style={{
                    fontSize: '1rem',
                    color: '#0A6ED1',
                  }}
                />
                <span style={{ fontSize: '0.875rem' }}>BETA</span>
              </span>
            </Button>
          </div>
        }
        onProfileClick={onProfileClick}
      />

      <ProfilePopover
        open={profilePopoverOpen}
        setOpen={setProfilePopoverOpen}
        popoverRef={profilePopoverRef}
      />
      <BetaPopover
        open={betaPopoverOpen}
        setOpen={setBetaPopoverOpen}
        popoverRef={betaPopoverRef}
      />
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
  const auth = useAuth();
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
            auth.removeUser();
          }}
        >
          {t('ShellBar.signOutButton')}
        </ListItemStandard>
      </List>
    </Popover>
  );
};

const BetaPopover = ({
  open,
  setOpen,
  popoverRef,
}: {
  open: boolean;
  setOpen: (arg0: boolean) => void;
  popoverRef: RefObject<PopoverDomRef | null>;
}) => {
  return (
    <Popover
      ref={popoverRef}
      placement={PopoverPlacement.Bottom}
      open={open}
      onClose={() => setOpen(false)}
    >
      <div style={{ padding: '1rem', maxWidth: '250px' }}>
        This web app is currently in Beta, and may not ready for productive use.
        We&apos;re actively improving the experience and would love your
        feedback—your input helps shape the future of the app!
      </div>
    </Popover>
  );
};
