import {
  Button,
  FlexBox,
  FlexBoxAlignItems,
  Text,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, useState } from 'react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';

export function AnimatedHoverTextButton({
  text,
  icon,
  onClick,
}: {
  text: string;
  icon: JSX.Element;
  onClick: (e: any) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Button
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
}
