import {
  Button,
  Icon,
  ResponsivePopover,
  ButtonDomRef,
  PopoverDomRef,
  Ui5CustomEvent,
  LinkDomRef,
} from '@ui5/webcomponents-react';
import { formatDateAsTimeAgo } from '../../utils/i18n/timeAgo.ts';
import { useState, useRef } from 'react';
import { AnimatedHoverTextButton } from '../Helper/AnimatedHoverTextButton.tsx';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import type { ControlPlaneStatusCondition } from '../../lib/api/types/crate/controlPlanes.ts';

import { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { LinkClickEventDetail } from '@ui5/webcomponents/dist/Link.js';
import { ConditionsMessageView } from '../ControlPlane/ConditionsMessageView.tsx';
import { ConditionMessageItem } from '../ControlPlane/ConditionMessageItem.tsx';
export interface ConditionsViewButtonProps {
  isOk: boolean;
  transitionTime: string;
  message?: string;
  positiveText?: string;
  negativeText?: string;
  hideOnHoverEffect?: boolean;
  conditions: ControlPlaneStatusCondition[];
}
export const ConditionsViewButton = ({
  isOk,
  transitionTime,
  message,
  positiveText,
  negativeText,
  hideOnHoverEffect,
  conditions,
}: ConditionsViewButtonProps) => {
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
          text={isOk ? (positiveText ?? '') : (negativeText ?? '')}
          onClick={handleOpenerClick}
        />
      )}

      <ResponsivePopover ref={popoverRef} open={open} placement={PopoverPlacement.Top} onClose={() => setOpen(false)}>
        {conditions.length > 1 && <ConditionsMessageView conditions={conditions} />}
        {conditions.length === 1 && <ConditionMessageItem condition={conditions[0]} />}
      </ResponsivePopover>
    </span>
  );
};
