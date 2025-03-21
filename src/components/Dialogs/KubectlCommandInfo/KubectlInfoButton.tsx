import { Button, ButtonPropTypes } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { CSSProperties } from 'react';

const INNERTEXT = 'Learn how to do this in code';

interface KubectlDialogProps extends ButtonPropTypes {
  style?: CSSProperties;
}
export const KubectlInfoButton = ({
  style,
  onClick,
  ...buttonProps
}: KubectlDialogProps) => {
  return (
    <>
      <Button
        design={ButtonDesign.Transparent}
        icon="sap-icon://command-line-interfaces"
        onClick={onClick}
        style={{ display: 'inline-block', ...style }}
        {...buttonProps}
      >
        {INNERTEXT}
      </Button>
    </>
  );
};
