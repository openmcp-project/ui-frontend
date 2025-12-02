import { Button, ButtonDomRef, FlexBox, FlexBoxAlignItems, Text } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, useId, useState } from 'react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import styles from './AnimatedHoverTextButton.module.css';
import { getClassNameForOverallStatus } from '../ControlPlane/MCPHealthPopoverButton.tsx';
import { ReadyStatus } from '../../lib/api/types/crate/controlPlanes.ts';
type HoverTextButtonProps = {
  id?: string;
  text: string;
  icon: JSX.Element;
  onClick: (event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => void;
  large?: boolean;
};
export const AnimatedHoverTextButton = ({ id, text, icon, onClick, large = false }: HoverTextButtonProps) => {
  const [hover, setHover] = useState(false);

  const generatedId = useId();
  id ??= generatedId;

  return (
    <Button id={id} onClick={onClick} onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <FlexBox alignItems={FlexBoxAlignItems.Center}>
        {hover || large ? (
          <Text className={styles[getClassNameForOverallStatus(text as ReadyStatus)]} style={{ marginRight: '8px' }}>
            {text}
          </Text>
        ) : null}
        {icon}
      </FlexBox>
    </Button>
  );
};
