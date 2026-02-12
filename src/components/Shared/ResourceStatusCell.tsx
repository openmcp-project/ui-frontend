import {
  Button,
  Icon,
  ResponsivePopover,
  MessageView,
  ButtonDomRef,
  PopoverDomRef,
  Ui5CustomEvent,
  LinkDomRef,
} from '@ui5/webcomponents-react';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo';
import { useId, useState, useRef } from 'react';
import { AnimatedHoverTextButton } from '../Helper/AnimatedHoverTextButton.tsx';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { ConditionMessageItem } from '../ControlPlane/ConditionMessageItem.tsx';
import type { ControlPlaneStatusCondition } from '../../lib/api/types/crate/controlPlanes';
import styles from './ResourceStatusCell.module.css';
import { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { LinkClickEventDetail } from '@ui5/webcomponents/dist/Link.js';
export interface ResourceStatusCellProps {
  isOk: boolean;
  transitionTime: string;
  message?: string;
  positiveText: string;
  negativeText: string;
  hideOnHoverEffect?: boolean;
}
export const ResourceStatusCell = ({
  isOk,
  transitionTime,
  message,
  positiveText,
  negativeText,
  hideOnHoverEffect,
}: ResourceStatusCellProps) => {
  const popoverRef = useRef<PopoverDomRef>(null);
  const buttonRef = useRef<ButtonDomRef>(null);
  const [open, setOpen] = useState(false);
  const timeAgo = transitionTime ? formatDateAsTimeAgo(transitionTime) : '-';
  const handleOpenerClick = (
    event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail> | Ui5CustomEvent<LinkDomRef, LinkClickEventDetail>,
  ) => {
    if (popoverRef.current) {
      // Prefer explicit button ref as opener (works reliably); fall back to event.target
      (popoverRef.current as unknown as { opener: EventTarget | null }).opener = buttonRef.current ?? event.target;
      setOpen((prev) => !prev);
    }
  };
  return (
    <span>
      {hideOnHoverEffect ? (
        <Button ref={buttonRef} design="Transparent" title={timeAgo} aria-label={timeAgo} onClick={handleOpenerClick}>
          <Icon
            design={isOk ? 'Positive' : 'Negative'}
            name={isOk ? 'sys-enter-2' : 'sys-cancel-2'}
            showTooltip={true}
            accessibleName={timeAgo}
          />
        </Button>
      ) : (
        <AnimatedHoverTextButton
          ref={buttonRef}
          icon={
            <Icon
              design={isOk ? 'Positive' : 'Negative'}
              name={isOk ? 'sys-enter-2' : 'sys-cancel-2'}
              showTooltip={true}
              accessibleName={timeAgo}
            />
          }
          text={isOk ? positiveText : negativeText}
          onClick={handleOpenerClick}
        />
      )}

      <ResponsivePopover ref={popoverRef} open={open} placement={PopoverPlacement.Top} onClose={() => setOpen(false)}>
        <ConditionMessageItem
          condition={
            {
              type: isOk ? positiveText : negativeText,
              status: isOk ? 'True' : 'False',
              reason: '',
              message: message || '',
              lastTransitionTime: transitionTime,
            } as ControlPlaneStatusCondition
          }
        />
      </ResponsivePopover>
    </span>
  );
};
