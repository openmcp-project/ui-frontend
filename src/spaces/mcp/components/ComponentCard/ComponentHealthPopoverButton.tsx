import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/in-progress-2';
import '@ui5/webcomponents-icons/dist/message-warning';
import '@ui5/webcomponents-icons/dist/pending';
import '@ui5/webcomponents-icons/dist/sys-enter-2';
import { ButtonDomRef, Icon, PopoverDomRef, ResponsivePopover } from '@ui5/webcomponents-react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useRef, useState } from 'react';

import { ConditionsMessageListView } from '../../../../components/ControlPlane/ConditionsMessageListView.tsx';
import { AnimatedHoverTextButton } from '../../../../components/Helper/AnimatedHoverTextButton.tsx';
import type { ControlPlaneStatusCondition } from '../../../../lib/api/types/crate/controlPlanes.ts';
import { useTelemetry } from '../../../../lib/telemetry/telemetry.ts';
import {
  getComponentPhaseVisual,
  InstancePhase,
  LOADING_PHASE_VISUAL,
  UNRECOGNIZED_PHASE_VISUAL,
} from './ComponentCardV2.tsx';
import styles from './ComponentHealthPopoverButton.module.css';

export interface ComponentHealthPopoverButtonProps {
  componentName: string;
  phase: string | null;
  conditions: ControlPlaneStatusCondition[];
  // Status query still in flight / errored. Without these, a not-yet-loaded or failed status
  // (phase === null) would fall through to the "Ready" default below and show a false-positive
  // green badge before we actually know the component's health.
  isLoading?: boolean;
  hasError?: boolean;
}

export function ComponentHealthPopoverButton({
  componentName,
  phase,
  conditions,
  isLoading = false,
  hasError = false,
}: ComponentHealthPopoverButtonProps) {
  const telemetry = useTelemetry();
  const popoverRef = useRef<PopoverDomRef>(null);
  const buttonRef = useRef<ButtonDomRef>(null);
  const [open, setOpen] = useState(false);

  const displayPhase = hasError ? 'Unknown' : isLoading ? 'Pending' : (phase ?? InstancePhase.Ready);
  const visual = hasError
    ? UNRECOGNIZED_PHASE_VISUAL
    : isLoading
      ? LOADING_PHASE_VISUAL
      : getComponentPhaseVisual(phase);
  const colorClassName = styles[`status${visual.state}`];

  const handleOpenerClick = (event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
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
    // The card this button sits in may itself be clickable (navigates to the component section).
    // `ResponsivePopover` doesn't expose a `click` event in @ui5/webcomponents-react's wrapper
    // (only before-close/before-open/close/open are wired up), so an `onClick` passed straight to
    // it is not reliably hooked up - stopping propagation here on a plain element, covering both
    // the opener button and anything clicked inside the open popover, is what actually works.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- this span is an event boundary, not a new interactive control; the actual interactive elements are the button/popover it wraps
    <span data-cy="component-health-button" onClick={(e) => e.stopPropagation()}>
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
