import {
  Avatar,
  Button,
  ButtonDomRef,
  Form,
  FormGroup,
  FormItem,
  Icon,
  Label,
  List,
  ListItemStandard,
  Popover,
  PopoverDomRef,
  RatingIndicator,
  ShellBar,
  ShellBarDomRef,
  ShellBarItem,
  ShellBarItemDomRef,
  TextArea,
  TextAreaDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ShellBarProfileClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBar.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation, Trans } from 'react-i18next';
import { generateInitialsForEmail } from '../Helper/generateInitialsForEmail.ts';
import styles from './ShellBar.module.css';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { ShellBarItemClickEventDetail } from '@ui5/webcomponents-fiori/dist/ShellBarItem.js';
import { t } from 'i18next';

type UI5RatingIndicatorElement = HTMLElement & { value: number };

export function ShellBarComponent() {
  const auth = useAuthOnboarding();
  const profilePopoverRef = useRef<PopoverDomRef>(null);
  const betaPopoverRef = useRef<PopoverDomRef>(null);
  const feedbackPopoverRef = useRef<PopoverDomRef>(null);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [betaPopoverOpen, setBetaPopoverOpen] = useState(false);
  const [feedbackPopoverOpen, setFeedbackPopoverOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const betaButtonRef = useRef<ButtonDomRef>(null);

  const { user } = useAuthOnboarding();

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

  const onFeedbackClick = (
    e: Ui5CustomEvent<ShellBarItemDomRef, ShellBarItemClickEventDetail>,
  ) => {
    feedbackPopoverRef.current!.opener = e.detail.targetRef;
    setFeedbackPopoverOpen(!feedbackPopoverOpen);
  };

  const onFeedbackMessageChange = (
    event: Ui5CustomEvent<
      TextAreaDomRef,
      { value: string; previousValue: string }
    >,
  ) => {
    const newValue = event.target.value;
    setFeedbackMessage(newValue);
  };

  async function onFeedbackSent() {
    const payload = {
      message: feedbackMessage,
      rating: rating.toString(),
      user: user?.email,
      environment: window.location.hostname,
    };
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.log(err);
    } finally {
      setFeedbackSent(true);
    }
  }

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
      >
        <ShellBarItem
          icon="feedback"
          text={t('ShellBar.feedbackNotification', {
            url: 'https://github.com/openmcp-project/ui-frontend/issues/new/choose',
          })}
          onClick={onFeedbackClick}
        />
      </ShellBar>

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

const FeedbackPopover = ({
  open,
  setOpen,
  popoverRef,
  setRating,
  rating,
  onFeedbackSent,
  feedbackMessage,
  onFeedbackMessageChange,
  feedbackSent,
}: {
  open: boolean;
  setOpen: (arg0: boolean) => void;
  popoverRef: RefObject<PopoverDomRef | null>;
  setRating: Dispatch<SetStateAction<number>>;
  rating: number;
  onFeedbackSent: () => void;
  feedbackMessage: string;
  onFeedbackMessageChange: (
    event: Ui5CustomEvent<
      TextAreaDomRef,
      {
        value: string;
        previousValue: string;
      }
    >,
  ) => void;
  feedbackSent: boolean;
}) => {
  const { t } = useTranslation();

  const onRatingChange = (
    event: Event & { target: UI5RatingIndicatorElement },
  ) => {
    setRating(event.target.value);
  };

  return (
    <>
      <Popover
        ref={popoverRef}
        placement={PopoverPlacement.Bottom}
        open={open}
        onClose={() => setOpen(false)}
      >
        <div
          style={{
            padding: '1rem',
            width: '250px',
          }}
        >
          {!feedbackSent ? (
            <Form headerText={t('ShellBar.feedbackHeader')}>
              <FormGroup>
                <FormItem
                  labelContent={
                    <Label style={{ color: 'black' }}>
                      {t('ShellBar.feedbackRatingLabel')}
                    </Label>
                  }
                >
                  <RatingIndicator
                    value={rating}
                    max={5}
                    onChange={onRatingChange}
                  />
                </FormItem>
                <FormItem
                  className="formAlignLabelStart"
                  labelContent={
                    <Label style={{ color: 'black' }}>
                      {t('ShellBar.feedbackMessageLabel')}
                    </Label>
                  }
                >
                  <TextArea
                    value={feedbackMessage}
                    placeholder={t('ShellBar.feedbackPlaceholder')}
                    rows={5}
                    onInput={onFeedbackMessageChange}
                  />
                </FormItem>
                <FormItem>
                  <Button design="Emphasized" onClick={() => onFeedbackSent()}>
                    {t('ShellBar.feedbackButton')}
                  </Button>
                </FormItem>
                <FormItem>
                  <Label style={{ color: 'gray' }}>
                    {t('ShellBar.feedbackNotificationText')}
                    <a
                      href="https://github.com/openmcp-project/ui-frontend/issues/new/choose"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('ShellBar.feedbackNotificationAction')}
                    </a>
                  </Label>
                </FormItem>
              </FormGroup>
            </Form>
          ) : (
            <Label>{t('ShellBar.feedbackThanks')}</Label>
          )}
        </div>
      </Popover>
    </>
  );
};
