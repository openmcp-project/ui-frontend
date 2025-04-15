import { FC } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  materialLight,
  materialDark,
} from 'react-syntax-highlighter/dist/esm/styles/prism'; // You can choose different styles
import YAML from 'yaml';
import { Button, FlexBox } from '@ui5/webcomponents-react';
import styles from './YamlViewer.module.css';
type YamlViewerProps = { yamlString: string };
const YamlViewer: FC<YamlViewerProps> = ({ yamlString }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(yamlString);
    alert('YAML copied to clipboard!');
  };
  const downloadYaml = () => {
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.yaml'; // Default filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url); // Clean up
  };

  let formattedYaml = yamlString;
  try {
    const parsed = YAML.parse(yamlString);
    formattedYaml = YAML.stringify(parsed);
  } catch (error) {
    console.error('Invalid YAML:', error);
  }

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
          Copy
        </Button>
        <Button icon="download" onClick={downloadYaml}>
          Download
        </Button>
      </FlexBox>
      <SyntaxHighlighter
        language="yaml"
        style={
          window.matchMedia('(prefers-color-scheme: dark)').matches
            ? materialDark
            : materialLight
        }
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
        {formattedYaml}
      </SyntaxHighlighter>
    </div>
  );
};

export default YamlViewer;
