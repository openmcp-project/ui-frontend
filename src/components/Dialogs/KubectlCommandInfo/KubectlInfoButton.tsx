import { Button, ButtonPropTypes } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useTranslation } from 'react-i18next';
import '@ui5/webcomponents-icons/dist/command-line-interfaces.js';

interface KubectlInfoButtonProps extends Omit<ButtonPropTypes, 'children'> {}

export const KubectlInfoButton = ({
  onClick,
  ...buttonProps
}: KubectlInfoButtonProps) => {
  const { t } = useTranslation();

  return (
    <Button
      design={ButtonDesign.Transparent}
      icon="command-line-interfaces"
      onClick={onClick}
      {...buttonProps}
    >
      {t('CommonKubectl.learnButton')}
    </Button>
  );
};
