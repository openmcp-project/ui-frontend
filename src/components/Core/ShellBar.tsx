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
import { useAuth } from '../../spaces/onboarding/auth/AuthContext.tsx';
import { RefObject, useEffect, useRef, useState } from 'react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { generateInitialsForEmail } from '../Helper/generateInitialsForEmail.ts';
import styles from './ShellBar.module.css';
import { ThemingParameters } from '@ui5/webcomponents-react-base';

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
            initials={generateInitialsForEmail(auth.user?.email)}
            size="XS"
          />
        }
        startButton={
          <div className={styles.container}>
            <div className={styles.logoWrapper}>
              <img src="/logo.png" alt="MCP" className={styles.logo} />
              <span className={styles.logoText}>MCP</span>
            </div>
            <Button
              ref={betaButtonRef}
              className={styles.betaButton}
              onClick={onBetaClick}
            >
              <span className={styles.betaContent}>
                <Icon name="information" className={styles.betaIcon} />
                <span className={styles.betaText}>Beta</span>
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
            void auth.logout();
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
  const { t } = useTranslation();

  return (
    <Popover
      ref={popoverRef}
      placement={PopoverPlacement.Bottom}
      open={open}
      onClose={() => setOpen(false)}
    >
      <div
        style={{
          padding: '1rem',
          maxWidth: '250px',
          fontFamily: ThemingParameters.sapFontFamily,
        }}
      >
        {t('ShellBar.betaButtonDescription')}
      </div>
    </Popover>
  );
};
