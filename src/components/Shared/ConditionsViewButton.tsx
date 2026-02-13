import {
  Button,
  Icon,
  ResponsivePopover,
  ButtonDomRef,
  PopoverDomRef,
  Ui5CustomEvent,
  LinkDomRef,
} from '@ui5/webcomponents-react';

import { useState, useRef } from 'react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import type { ControlPlaneStatusCondition } from '../../lib/api/types/crate/controlPlanes.ts';

import { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { LinkClickEventDetail } from '@ui5/webcomponents/dist/Link.js';
import { ConditionsMessageView } from '../ControlPlane/ConditionsMessageView.tsx';
import { ConditionMessageItem } from '../ControlPlane/ConditionMessageItem.tsx';
export interface ConditionsViewButtonProps {
  isOk: boolean;
  message?: string;
  positiveText?: string;
  negativeText?: string;
  conditions: ControlPlaneStatusCondition[];
}
export const ConditionsViewButton = ({ isOk, conditions }: ConditionsViewButtonProps) => {
  const popoverRef = useRef<PopoverDomRef>(null);
  const buttonRef = useRef<ButtonDomRef>(null);
  const [open, setOpen] = useState(false);

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
      <Button ref={buttonRef} design="Transparent" onClick={handleOpenerClick}>
        <Icon design={isOk ? 'Positive' : 'Negative'} name={isOk ? 'sys-enter-2' : 'sys-cancel-2'} showTooltip={true} />
      </Button>

      <ResponsivePopover ref={popoverRef} open={open} placement={PopoverPlacement.Top} onClose={() => setOpen(false)}>
        {conditions.length > 1 && <ConditionsMessageView conditions={conditions} />}
        {conditions.length === 1 && <ConditionMessageItem condition={conditions[0]} />}
      </ResponsivePopover>
    </span>
  );
};
