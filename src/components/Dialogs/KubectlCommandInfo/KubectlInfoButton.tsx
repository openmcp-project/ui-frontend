import { Button, ButtonPropTypes } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import '@ui5/webcomponents-icons/dist/command-line-interfaces.js';

interface KubectlDialogProps extends ButtonPropTypes {
  style?: CSSProperties;
}
export const KubectlInfoButton = ({
  style,
  onClick,
  ...buttonProps
}: KubectlDialogProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Button
        design={ButtonDesign.Transparent}
        icon="command-line-interfaces"
        style={{ display: 'inline-block', ...style }}
        onClick={onClick}
        {...buttonProps}
      >
        {t('CommonKubectl.learnButton')}
      </Button>
    </>
  );
};
