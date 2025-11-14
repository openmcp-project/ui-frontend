import { Button, ButtonDomRef, FlexBox, FlexBoxAlignItems, Text } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, useId, useState } from 'react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';

type HoverTextButtonProps = {
  id?: string;
  text: string;
  icon: JSX.Element;
  onClick: (event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => void;
};
export const AnimatedHoverTextButton = ({ id, text, icon, onClick }: HoverTextButtonProps) => {
  const [hover, setHover] = useState(false);

  const generatedId = useId();
  id ??= generatedId;

  return (
    <Button
      id={id}
      design={ButtonDesign.Transparent}
      onClick={onClick}
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <FlexBox alignItems={FlexBoxAlignItems.Center}>
        {hover ? <Text style={{ marginRight: '8px' }}> {text}</Text> : null}
        {icon}
      </FlexBox>
    </Button>
  );
};
