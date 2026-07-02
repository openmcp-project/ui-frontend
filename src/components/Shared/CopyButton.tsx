import { Button, ButtonPropTypes } from '@ui5/webcomponents-react';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { CSSProperties, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCopyButton } from '../../context/CopyButtonContext.tsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import type { TelemetryFeature } from '../../lib/telemetry/features.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import styles from './CopyButton.module.css';

type CopySource = Extract<TelemetryFeature, { name: 'clipboard.copied' }>['source'];

interface CopyButtonProps extends Omit<ButtonPropTypes, 'children'> {
  text: string;
  source: CopySource;
  style?: CSSProperties;
  collapsible?: boolean;
}

export const CopyButton = ({ text, source, style = {}, collapsible = false, ...buttonProps }: CopyButtonProps) => {
  const { copyToClipboard } = useCopyToClipboard();
  const { activeCopyId, setActiveCopyId } = useCopyButton();
  const uniqueId = useId();
  const isCopied = activeCopyId === uniqueId;
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text, { showToastOnSuccess: false });
    if (success) {
      setActiveCopyId(uniqueId);
      telemetry.track({ name: 'clipboard.copied', source });
    }
  };

  const defaultStyle: CSSProperties = {
    border: '1px solid transparent',
    color: isCopied ? undefined : ThemingParameters.sapContent_LabelColor,
    ...(collapsible ? { justifyContent: 'start' } : {}),
  };

  const showFullText = !collapsible || isHovered || isCopied;
  const buttonText = isCopied ? t('common.copyToClipboardSuccessToast') : text;

  const button = (
    <Button
      icon="copy"
      design={isCopied ? 'Positive' : 'Transparent'}
      tooltip={collapsible ? text : 'Copy'}
      style={{ ...defaultStyle, ...style }}
      className={collapsible ? `${styles.button} ${showFullText ? styles.expanded : styles.collapsed}` : undefined}
      onClick={handleCopy}
      onMouseEnter={collapsible ? () => setIsHovered(true) : undefined}
      onMouseLeave={collapsible ? () => setIsHovered(false) : undefined}
      onFocus={collapsible ? () => setIsHovered(true) : undefined}
      onBlur={collapsible ? () => setIsHovered(false) : undefined}
      {...buttonProps}
    >
      {collapsible ? <span className={styles.text}>{buttonText}</span> : buttonText}
    </Button>
  );

  if (collapsible) {
    return <div className={styles.container}>{button}</div>;
  }

  return button;
};
