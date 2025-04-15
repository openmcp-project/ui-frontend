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
import { useAuth } from 'react-oidc-context';
import { RefObject, useRef, useState } from 'react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { generateInitialsForEmail } from '../Helper/GenerateInitialsForEmail';

export function ShellBarComponent() {
  const auth = useAuth();
  const profilePopoverRef = useRef<PopoverDomRef>(null);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);

  const onProfileClick = (
    e: Ui5CustomEvent<ShellBarDomRef, ShellBarProfileClickEventDetail>,
  ) => {
    profilePopoverRef.current!.opener = e.detail.targetRef;
    setProfilePopoverOpen(!profilePopoverOpen);
  };

  return (
    <>
      <ShellBar
        logo={<img src="/logo.png" alt="MCP" />}
        primaryTitle="MCP"
        profile={
          <Avatar
            initials={generateInitialsForEmail(auth.user?.profile.email)}
            size="XS"
          />
        }
        onProfileClick={onProfileClick}
      />
      <ProfilePopover
        open={profilePopoverOpen}
        setOpen={(b) => setProfilePopoverOpen(b)}
        popoverRef={profilePopoverRef}
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
    <>
      <Popover
        ref={popoverRef}
        placement={PopoverPlacement.Bottom}
        open={open}
        headerText="Profile"
        onClose={() => {
          setOpen(false);
        }}
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
    </>
  );
};
