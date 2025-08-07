import { Button, ButtonDomRef, FlexBox, FlexBoxAlignItems, Text } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, RefObject, useState } from 'react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';

type HoverTextButtonProps = {
  text: string;
  icon: JSX.Element;
  ref?: RefObject<ButtonDomRef | null>;
  onClick: () => void;
};
export const AnimatedHoverTextButton = ({ text, icon, onClick, ref }: HoverTextButtonProps) => {
  const [hover, setHover] = useState(false);
  return (
    <Button
      ref={ref}
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
