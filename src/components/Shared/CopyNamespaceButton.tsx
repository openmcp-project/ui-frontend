import { Button, ButtonPropTypes } from '@ui5/webcomponents-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useId, CSSProperties, useState } from 'react';
import { useCopyButton } from '../../context/CopyButtonContext.tsx';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { useTranslation } from 'react-i18next';
import styles from './CopyNamespaceButton.module.css';

interface CopyNamespaceButtonProps extends Omit<ButtonPropTypes, 'children'> {
  namespace: string;
  style?: CSSProperties;
}

export const CopyNamespaceButton = ({ namespace, style = {}, ...buttonProps }: CopyNamespaceButtonProps) => {
  const { copyToClipboard } = useCopyToClipboard();
  const { activeCopyId, setActiveCopyId } = useCopyButton();
  const uniqueId = useId();
  const isCopied = activeCopyId === uniqueId;
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(namespace, { showToastOnSuccess: false });
    setActiveCopyId(uniqueId);
  };

  const defaultStyle: CSSProperties = {
    color: isCopied ? undefined : ThemingParameters.sapContent_LabelColor,
    justifyContent: 'start',
  };

  const buttonText = isCopied ? t('common.copyToClipboardSuccessToast') : namespace;
  const showFullText = isHovered || isCopied;

  return (
    <div className={styles.container}>
      <Button
        icon="copy"
        design={isCopied ? 'Positive' : 'Transparent'}
        tooltip={namespace}
        style={{ ...defaultStyle, ...style }}
        className={`${styles.button} ${showFullText ? styles.expanded : styles.collapsed}`}
        onClick={handleCopy}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...buttonProps}
      >
        <span className={styles.text}>{buttonText}</span>
      </Button>
    </div>
  );
};
