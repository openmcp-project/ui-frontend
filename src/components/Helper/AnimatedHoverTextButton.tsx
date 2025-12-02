import { Button, ButtonDomRef, Link, LinkDomRef, FlexBox, FlexBoxAlignItems, Text } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, useId, useState } from 'react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import type { LinkClickEventDetail } from '@ui5/webcomponents/dist/Link.js';
import styles from './AnimatedHoverTextButton.module.css';
import { getClassNameForOverallStatus } from '../ControlPlane/MCPHealthPopoverButton.tsx';
import { ReadyStatus } from '../../lib/api/types/crate/controlPlanes.ts';
import cx from 'clsx';
type HoverTextButtonProps = {
  id?: string;
  text: string;
  icon: JSX.Element;
  onClick: (
    event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail> | Ui5CustomEvent<LinkDomRef, LinkClickEventDetail>,
  ) => void;
  large?: boolean;
};
export const AnimatedHoverTextButton = ({ id, text, icon, onClick, large = false }: HoverTextButtonProps) => {
  const [hover, setHover] = useState(false);

  const generatedId = useId();
  id ??= generatedId;

  const content = (
    <FlexBox alignItems={FlexBoxAlignItems.Center}>
      {hover || large ? (
        <Text
          className={cx(styles.text, styles[getClassNameForOverallStatus(text as ReadyStatus)], {
            [styles.large]: large,
          })}
        >
          {text}
        </Text>
      ) : null}
      {icon}
    </FlexBox>
  );

  if (large) {
    return (
      <Link
        id={id}
        className={cx(styles.link, styles[getClassNameForOverallStatus(text ? (text as ReadyStatus) : undefined)])}
        onClick={onClick}
        onMouseLeave={() => setHover(false)}
        onMouseOver={() => setHover(true)}
      >
        {content}
      </Link>
    );
  }

  return (
    <Button
      id={id}
      design={'Transparent'}
      onClick={onClick}
      onMouseLeave={() => setHover(false)}
      onMouseOver={() => setHover(true)}
    >
      {content}
    </Button>
  );
};
