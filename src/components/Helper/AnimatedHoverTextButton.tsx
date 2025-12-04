import { Button, ButtonDomRef, FlexBox, FlexBoxAlignItems } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, useId, useState, forwardRef } from 'react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';

import styles from './AnimatedHoverTextButton.module.css';
import { getClassNameForOverallStatus } from '../ControlPlane/statusUtils';
import { ReadyStatus } from '../../lib/api/types/crate/controlPlanes.ts';
import cx from 'clsx';
type HoverTextButtonProps = {
  id?: string;
  text: string;
  icon: JSX.Element;
  onClick: (event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => void;
  large?: boolean;
};

export const AnimatedHoverTextButton = forwardRef<ButtonDomRef, HoverTextButtonProps>(
  ({ id, text, icon, onClick, large = false }: HoverTextButtonProps, ref) => {
    const [hover, setHover] = useState(false);

    const generatedId = useId();
    id ??= generatedId;

    const content = (
      <FlexBox alignItems={FlexBoxAlignItems.Center}>
        {hover || large ? (
          <span
            className={cx(styles.text, styles[getClassNameForOverallStatus(text as ReadyStatus)], {
              [styles.large]: large,
            })}
          >
            {text}
          </span>
        ) : null}
        {icon}
      </FlexBox>
    );

    if (large) {
      return (
        <Button
          ref={ref}
          id={id}
          design={'Transparent'}
          className={cx(styles.link, styles[getClassNameForOverallStatus(text ? (text as ReadyStatus) : undefined)])}
          onClick={onClick}
          onMouseLeave={() => setHover(false)}
          onMouseOver={() => setHover(true)}
        >
          {content}
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        id={id}
        design={'Transparent'}
        onClick={onClick}
        onMouseLeave={() => setHover(false)}
        onMouseOver={() => setHover(true)}
      >
        {content}
      </Button>
    );
  },
);

AnimatedHoverTextButton.displayName = 'AnimatedHoverTextButton';
