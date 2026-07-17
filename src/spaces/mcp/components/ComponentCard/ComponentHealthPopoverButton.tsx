import { ButtonDomRef, Icon, PopoverDomRef, ResponsivePopover } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import '@ui5/webcomponents-icons/dist/pending';
import '@ui5/webcomponents-icons/dist/in-progress-2';
import '@ui5/webcomponents-icons/dist/error';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/question-mark';
import '@ui5/webcomponents-icons/dist/message-warning';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import { useRef, useState } from 'react';

import { AnimatedHoverTextButton } from '../../../../components/Helper/AnimatedHoverTextButton.tsx';
import { ConditionsMessageListView } from '../../../../components/ControlPlane/ConditionsMessageListView.tsx';
import type { ControlPlaneStatusCondition } from '../../../../lib/api/types/crate/controlPlanes.ts';
import { useTelemetry } from '../../../../lib/telemetry/telemetry.ts';
import { getComponentPhaseVisual, InstancePhase } from './ComponentCardV2.tsx';
import styles from './ComponentHealthPopoverButton.module.css';

export interface ComponentHealthPopoverButtonProps {
  componentName: string;
  phase: string | null;
  conditions: ControlPlaneStatusCondition[];
}

export function ComponentHealthPopoverButton({ componentName, phase, conditions }: ComponentHealthPopoverButtonProps) {
  const telemetry = useTelemetry();
  const popoverRef = useRef<PopoverDomRef>(null);
  const buttonRef = useRef<ButtonDomRef>(null);
  const [open, setOpen] = useState(false);

  const displayPhase = phase ?? InstancePhase.Ready;
  const visual = getComponentPhaseVisual(phase);
  const colorClassName = styles[`status${visual.state}`];

  const handleOpenerClick = (event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    // The card this button sits in may itself be clickable (navigates to the component
    // section); without this, opening the popover would also trigger that navigation.
    event.stopPropagation();
    if (popoverRef.current) {
      // Prefer explicit button ref as opener (works reliably); fall back to event.target
      (popoverRef.current as unknown as { opener: EventTarget | null }).opener = buttonRef.current ?? event.target;
      setOpen((prev) => {
        if (!prev) telemetry.track({ name: 'component.status-viewed', componentName });
        return !prev;
      });
    }
  };

  return (
    <span data-cy="component-health-button">
      <AnimatedHoverTextButton
        ref={buttonRef}
        icon={<Icon className={colorClassName} name={`sap-icon://${visual.icon}`} />}
        text={displayPhase}
        alwaysShowText
        textClassName={colorClassName}
        onClick={handleOpenerClick}
      />
      <ResponsivePopover ref={popoverRef} placement={PopoverPlacement.Top} open={open} onClose={() => setOpen(false)}>
        {open && <ConditionsMessageListView conditions={conditions} />}
      </ResponsivePopover>
    </span>
  );
}
