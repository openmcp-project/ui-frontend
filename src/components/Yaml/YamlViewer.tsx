import { FC } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Button, FlexBox } from '@ui5/webcomponents-react';
import styles from './YamlViewer.module.css';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme.ts';
type YamlViewerProps = { yamlString: string; filename: string };

const IS_YAML_DOWNLOAD_ENABLED = false; // to disable download button for yaml files due to stakeholders decision
const YamlViewer: FC<YamlViewerProps> = ({ yamlString, filename }) => {
  const { t } = useTranslation();
  const { isDarkTheme } = useTheme();
  const { copyToClipboard } = useCopyToClipboard();
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
      <FlexBox className={styles.buttons} direction="Row" justifyContent="End" alignItems="Baseline" gap={16}>
        <Button icon="copy" onClick={() => copyToClipboard(yamlString)}>
          {t('buttons.copy')}
        </Button>
        {IS_YAML_DOWNLOAD_ENABLED && (
          <Button icon="download" onClick={downloadYaml}>
            {t('buttons.download')}
          </Button>
        )}
      </FlexBox>
      <SyntaxHighlighter
        language="yaml"
        style={isDarkTheme ? materialDark : materialLight}
        showLineNumbers
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
          background: 'transparent',
        }}
        codeTagProps={{
          style: {
            whiteSpace: 'pre-wrap',
          },
        }}
      >
        {yamlString}
      </SyntaxHighlighter>
    </div>
  );
};

export default YamlViewer;
