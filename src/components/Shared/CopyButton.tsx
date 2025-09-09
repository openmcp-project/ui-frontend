import { Button, ButtonPropTypes } from '@ui5/webcomponents-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useId, CSSProperties } from 'react';
import { useCopyButton } from '../../context/CopyButtonContext.tsx';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { useTranslation } from 'react-i18next';

interface CopyButtonProps extends ButtonPropTypes {
  text: string;
  style?: CSSProperties;
}

export const CopyButton = ({ text, style = {}, ...buttonProps }: CopyButtonProps) => {
  const { copyToClipboard } = useCopyToClipboard();
  const { activeCopyId, setActiveCopyId } = useCopyButton();
  const uniqueId = useId();
  const isCopied = activeCopyId === uniqueId;
  const { t } = useTranslation();

  const handleCopy = async () => {
    await copyToClipboard(text, false);
    setActiveCopyId(uniqueId);
  };

  const defaultStyle: CSSProperties = {
    color: isCopied ? undefined : ThemingParameters.sapContent_LabelColor,
  };

  return (
    <Button
      icon="copy"
      design={isCopied ? 'Positive' : 'Transparent'}
      tooltip="Copy"
      style={{ ...defaultStyle, ...style }}
      onClick={handleCopy}
      {...buttonProps}
    >
      {isCopied ? t('common.copyToClipboardSuccessToast') : text}
    </Button>
  );
};
