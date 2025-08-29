import { PopoverDomRef, Ui5CustomEvent, TextAreaDomRef, Button, ButtonDomRef, Popover, Form, FormGroup, FormItem, Label, Link, RatingIndicator, TextArea } from "@ui5/webcomponents-react";
import { Dispatch, RefObject, SetStateAction, useRef, useState } from "react";
import { useAuthOnboarding } from "../../spaces/onboarding/auth/AuthContextOnboarding";
import { useTranslation } from "react-i18next";
import { ButtonClickEventDetail } from "@ui5/webcomponents/dist/Button.js";
import PopoverPlacement from "@ui5/webcomponents/dist/types/PopoverPlacement.js";
import ButtonDesign from "@ui5/webcomponents/dist/types/ButtonDesign.js";

type UI5RatingIndicatorElement = HTMLElement & { value: number };


export function FeedbackButton() {
  const feedbackPopoverRef = useRef<PopoverDomRef>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackPopoverOpen, setFeedbackPopoverOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const { user } = useAuthOnboarding();

  const onFeedbackClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    feedbackPopoverRef.current!.opener = e.target;
    setFeedbackPopoverOpen(!feedbackPopoverOpen);
  };

  const onFeedbackMessageChange = (event: Ui5CustomEvent<TextAreaDomRef, { value: string; previousValue: string }>) => {
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

  return (
    <>
      <Button
        icon="feedback"
        tooltip="Feedback"
        onClick={onFeedbackClick}
        design={ButtonDesign.Transparent}
      >

      </Button>
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
  )
}

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

  const onRatingChange = (event: Event & { target: UI5RatingIndicatorElement }) => {
    setRating(event.target.value);
  };

  return (
    <>
      <Popover ref={popoverRef} placement={PopoverPlacement.Bottom} open={open} onClose={() => setOpen(false)}>
        <div
          style={{
            padding: '1rem',
            width: '250px',
          }}
        >
          {!feedbackSent ? (
            <Form headerText={t('ShellBar.feedbackHeader')}>
              <FormGroup>
                <FormItem labelContent={<Label style={{ color: 'black' }}>{t('ShellBar.feedbackRatingLabel')}</Label>}>
                  <RatingIndicator value={rating} max={5} onChange={onRatingChange} />
                </FormItem>
                <FormItem
                  className="formAlignLabelStart"
                  labelContent={<Label style={{ color: 'black' }}>{t('ShellBar.feedbackMessageLabel')}</Label>}
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
                    <Link
                      href="https://github.com/openmcp-project/ui-frontend/issues/new/choose"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('ShellBar.feedbackNotificationAction')}
                    </Link>
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
