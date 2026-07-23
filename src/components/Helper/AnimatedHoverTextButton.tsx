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
  alwaysShowText?: boolean;
  // Overrides the default ReadyStatus-based text color (e.g. for callers with their own
  // status vocabulary/palette that the icon they pass is already colored with).
  textClassName?: string;
  'data-testid'?: string;
};

export const AnimatedHoverTextButton = forwardRef<ButtonDomRef, HoverTextButtonProps>(
  (
    {
      id,
      text,
      icon,
      onClick,
      large = false,
      alwaysShowText = false,
      textClassName,
      'data-testid': dataTestId,
    }: HoverTextButtonProps,
    ref,
  ) => {
    const generatedId = useId();
    id ??= generatedId;

    const colorClassName = textClassName ?? styles[getClassNameForOverallStatus(text)];

    const content = (
      <FlexBox alignItems={FlexBoxAlignItems.Center}>
        {large || alwaysShowText ? (
          <span
            className={cx(styles.text, colorClassName, {
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
          data-testid={dataTestId}
          design={'Transparent'}
          className={cx(styles.link, colorClassName)}
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
