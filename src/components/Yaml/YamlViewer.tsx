import { FC } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  materialLight,
  materialDark,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Button, FlexBox } from '@ui5/webcomponents-react';
import styles from './YamlViewer.module.css';
import { useToast } from '../../context/ToastContext.tsx';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../lib/useThemeMode.ts';
type YamlViewerProps = { yamlString: string; filename: string };
const YamlViewer: FC<YamlViewerProps> = ({ yamlString, filename }) => {
  const toast = useToast();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeMode();
  const copyToClipboard = () => {
    navigator.clipboard.writeText(yamlString);
    toast.show(t('yaml.copiedToClipboard'));
  };
  const downloadYaml = () => {
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <FlexBox
        className={styles.buttons}
        direction="Row"
        justifyContent="End"
        alignItems="Baseline"
        gap={16}
      >
        <Button icon="copy" onClick={copyToClipboard}>
          {t('buttons.copy')}
        </Button>
        <Button icon="download" onClick={downloadYaml}>
          {t('buttons.download')}
        </Button>
      </FlexBox>
      <SyntaxHighlighter
        language="yaml"
        style={isDarkMode ? materialDark : materialLight}
        showLineNumbers
        wrapLines
        wrapLongLines
        lineNumberStyle={{
          paddingRight: '20px',
          minWidth: '40px',
          textAlign: 'right',
        }}
        customStyle={{
          margin: 0,
          padding: '20px',
          borderRadius: '4px',
          fontSize: '1rem',
          width: '100%',
          background: 'transparent',
        }}
      >
        {yamlString}
      </SyntaxHighlighter>
    </div>
  );
};

export default YamlViewer;
