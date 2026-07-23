import { Button, ButtonDomRef, FlexBox, FlexBoxAlignItems } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, useId, forwardRef } from 'react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';

import styles from './AnimatedHoverTextButton.module.css';
import { getClassNameForOverallStatus } from '../ControlPlane/statusUtils';
import cx from 'clsx';
type HoverTextButtonProps = {
  id?: string;
  text: string;
  icon: JSX.Element;
  onClick: (event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => void;
  large?: boolean;
  'data-testid'?: string;
};

export const AnimatedHoverTextButton = forwardRef<ButtonDomRef, HoverTextButtonProps>(
  ({ id, text, icon, onClick, large = false, 'data-testid': dataTestId }: HoverTextButtonProps, ref) => {
    const generatedId = useId();
    id ??= generatedId;

    const content = (
      <FlexBox alignItems={FlexBoxAlignItems.Center}>
        <span
          className={cx(styles.text, styles[getClassNameForOverallStatus(text)], {
            [styles.large]: large,
          })}
        >
          {text}
        </span>
        {icon}
      </FlexBox>
    );

    if (large) {
      return (
        <Button
          ref={ref}
          id={id}
          data-testid={dataTestId}
          design={'Transparent'}
          className={cx(styles.link, styles[getClassNameForOverallStatus(text)])}
          onClick={onClick}
        >
          {content}
        </Button>
      );
    }

    return (
      <Button ref={ref} id={id} data-testid={dataTestId} design={'Transparent'} onClick={onClick}>
        {content}
      </Button>
    );
  },
);

AnimatedHoverTextButton.displayName = 'AnimatedHoverTextButton';
