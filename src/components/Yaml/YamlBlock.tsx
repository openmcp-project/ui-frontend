import { ReactNode, useMemo } from 'react';
import { Toolbar, ToolbarButton, ToolbarSpacer, Title } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { downloadYamlFile } from './downloadYamlFile.ts';
import { YamlCodeEditor } from './core/YamlCodeEditor.tsx';
import type { YamlValidity } from './core/useYamlValidity.ts';
import type { JSONSchema4 } from 'json-schema';
import cx from 'clsx';
import styles from './YamlBlock.module.css';

export interface YamlBlockProps {
  value: string;
  filename: string;
  title?: string;
  mode?: 'view' | 'edit';
  size?: 'fill' | 'content' | number;
  actions?: ('copy' | 'download')[];
  extraActions?: ReactNode;
  schema?: JSONSchema4;
  onChange?: (yaml: string) => void;
  onValidityChange?: (v: YamlValidity) => void;
}

export function YamlBlock({
  value,
  filename,
  title,
  mode = 'view',
  size = 'fill',
  actions = ['copy', 'download'],
  extraActions,
  schema,
  onChange,
  onValidityChange,
}: YamlBlockProps) {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyToClipboard();

  const showCopy = actions.includes('copy');
  const showDownload = actions.includes('download');
  const hasHeader = !!(title || extraActions || showCopy || showDownload);

  const rootStyle = useMemo(() => (typeof size === 'number' ? { height: `${size}px` } : undefined), [size]);

  return (
    <div
      className={cx(styles.root, {
        [styles.rootFill]: size === 'fill',
        [styles.rootContent]: size === 'content',
      })}
      style={rootStyle}
    >
      {hasHeader && (
        <Toolbar className={styles.header}>
          {title && <Title level="H5">{title}</Title>}
          <ToolbarSpacer />
          {extraActions}
          {showCopy && (
            <ToolbarButton
              icon="copy"
              text={t('buttons.copy')}
              design="Transparent"
              onClick={() => copyToClipboard(value)}
            />
          )}
          {showDownload && (
            <ToolbarButton
              icon="download"
              text={t('buttons.download')}
              design="Transparent"
              onClick={() => downloadYamlFile(value, filename)}
            />
          )}
        </Toolbar>
      )}
      <div className={styles.body}>
        <YamlCodeEditor
          value={value}
          filename={filename}
          mode={mode}
          schema={schema}
          onChange={onChange}
          onValidityChange={onValidityChange}
        />
      </div>
    </div>
  );
}
