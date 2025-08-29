import {
  Avatar,
  List,
  ListItemStandard,
  Popover,
  PopoverDomRef,
  ShellBar,
  ShellBarDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { RefObject, useEffect, useRef, useState } from 'react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { generateInitialsForEmail } from '../Helper/generateInitialsForEmail.ts';
import styles from './ShellBar.module.css';

export function ShellBarComponent() {
  const auth = useAuthOnboarding();
  const profilePopoverRef = useRef<PopoverDomRef>(null);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);

  const onProfileClick = (e: Ui5CustomEvent<ShellBarDomRef, ShellBarProfileClickEventDetail>) => {
    profilePopoverRef.current!.opener = e.detail.targetRef;
    setProfilePopoverOpen(!profilePopoverOpen);
  };

  useEffect(() => {
    const shellbar = document.querySelector('ui5-shellbar');
    const el = shellbar?.shadowRoot?.querySelector('.ui5-shellbar-overflow-container-left');

    if (el) {
      (el as HTMLElement).style.backgroundColor = 'red';
    }
  }, []);

  return (
    <>
      <ShellBar
        className={styles.TestShellbar}
        hidden={window.location.href.includes('compact-mode')}
        profile={<Avatar initials={generateInitialsForEmail(auth.user?.email)} size="XS" />}
        startButton={
          <div className={styles.container}>
            <div className={styles.logoWrapper}>
              <img src="/logo.png" alt="MCP" className={styles.logo} />
              <span className={styles.logoText}>MCP</span>
            </div>
          </div>
        }
        onProfileClick={onProfileClick}
      />

      <ProfilePopover open={profilePopoverOpen} setOpen={setProfilePopoverOpen} popoverRef={profilePopoverRef} />
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
