import {
  Avatar,
  List,
  ListItemStandard,
  Popover,
  PopoverDomRef,
  ShellBar,
  ShellBarDomRef,
  Ui5CustomEvent,
  TextAreaDomRef,
} from '@ui5/webcomponents-react';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { RefObject, useEffect, useRef, useState } from 'react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { generateInitialsForEmail } from '../Helper/generateInitialsForEmail.ts';
import SapLogo from '../../assets/images/sap-logo.svg';
import styles from './ShellBar.module.css';
import { BetaButton } from './BetaButton.tsx';
import { FeedbackPopover } from './FeedbackButton.tsx';
import { TextAreaInputEventDetail } from '@ui5/webcomponents/dist/TextArea.js';
import { useToast } from '../../context/ToastContext.tsx';
import * as Sentry from '@sentry/react';

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
              <img src={SapLogo} alt="SAP" className={styles.logo} />
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <span className={styles.logoText}>ManagedControlPlane UI</span>
            </div>
          </div>
        }
        onProfileClick={onProfileClick}
      >
        <BetaButton />
      </ShellBar>

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
  const feedbackPopoverRef = useRef<PopoverDomRef>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackPopoverOpen, setFeedbackPopoverOpen] = useState(false);
  const [rating, setRating] = useState(0);
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
    setOpen(false);
    feedbackPopoverRef.current!.opener = e.target as HTMLElement;
    setFeedbackPopoverOpen(true);
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
