import { FC } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { createPatch, diffLines } from 'diff';
import { Button, FlexBox } from '@ui5/webcomponents-react';
import styles from './YamlViewer.module.css';
import { useToast } from '../../context/ToastContext.tsx';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme.ts';
type YamlViewerProps = { originalYamlString?: string; yamlString: string; filename: string };
const YamlViewer: FC<YamlViewerProps> = ({ originalYamlString, yamlString, filename }) => {
  const toast = useToast();
  const { t } = useTranslation();
  const { isDarkTheme } = useTheme();
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

  const contentToRender =
    originalYamlString !== undefined ? createPatch(`${filename}.yaml`, originalYamlString, yamlString) : yamlString;

  // console.log(originalYamlString !== undefined ? diffLines(originalYamlString, yamlString) : yamlString);

  const language = originalYamlString !== undefined ? 'diff' : 'yaml';
  console.log('1');
  console.log(yamlString);
  console.log('2');
  console.log(originalYamlString);
  return (
    <div className={styles.container}>
      <FlexBox className={styles.buttons} direction="Row" justifyContent="End" alignItems="Baseline" gap={16}>
        <Button icon="copy" onClick={copyToClipboard}>
          {t('buttons.copy')}
        </Button>
        <Button icon="download" onClick={downloadYaml}>
          {t('buttons.download')}
        </Button>
      </FlexBox>
      <SyntaxHighlighter
        language={language}
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
        {contentToRender}
      </SyntaxHighlighter>
    </div>
  );
};

export default YamlViewer;
