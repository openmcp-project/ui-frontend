import { Button, ButtonPropTypes } from '@ui5/webcomponents-react';
import { useToast } from '../../context/ToastContext.tsx';
import { useId, CSSProperties } from 'react';
import { useCopyButton } from '../../context/CopyButtonContext.tsx';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { useTranslation } from 'react-i18next';

interface CopyButtonProps extends ButtonPropTypes {
  text: string;
  style?: CSSProperties;
}

export const CopyButton = ({ text, style = {}, ...buttonProps }: CopyButtonProps) => {
  const { show } = useToast();
  const { activeCopyId, setActiveCopyId } = useCopyButton();
  const uniqueId = useId();
  const isCopied = activeCopyId === uniqueId;
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setActiveCopyId(uniqueId);
    } catch (err) {
      console.error(`Failed to copy text: ${text}. Error: ${err}`);
      show(`${t('CopyButton.copiedMessage')} ${err}`);
    }
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
      {isCopied ? t('CopyButton.copiedMessage') : text}
    </Button>
  );
};
