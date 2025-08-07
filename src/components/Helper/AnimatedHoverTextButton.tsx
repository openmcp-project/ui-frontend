import { Button, ButtonDomRef, FlexBox, FlexBoxAlignItems, Text } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, RefObject, useState } from 'react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';

export function AnimatedHoverTextButton({
  text,
  icon,

  ref,
}: {
  text: string;
  icon: JSX.Element;

  ref?: RefObject<ButtonDomRef | null>;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Button
      ref={ref}
      design={ButtonDesign.Transparent}
      onMouseOver={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <FlexBox alignItems={FlexBoxAlignItems.Center}>
        {hover ? <Text style={{ marginRight: '8px' }}> {text}</Text> : null}
        {icon}
      </FlexBox>
    </Button>
  );
}
