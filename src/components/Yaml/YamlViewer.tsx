import { FC } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  materialLight,
  materialDark,
} from 'react-syntax-highlighter/dist/esm/styles/prism'; // You can choose different styles
import YAML from 'yaml';
import { Button } from '@ui5/webcomponents-react';

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
    <div style={{ position: 'relative', width: '80%' }}>
      <Button
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '5px 10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1,
        }}
        onClick={copyToClipboard}
      >
        Copy
      </Button>
      <Button
        // style={{
        //   position: 'absolute',
        //   top: '10px',
        //   right: '90px',
        //   padding: '5px 10px',
        //   background: '#28a745',
        //   color: 'white',
        //   border: 'none',
        //   borderRadius: '4px',
        //   cursor: 'pointer',
        //   zIndex: 1,
        // }}
        onClick={downloadYaml}
      >
        Download
      </Button>

      <SyntaxHighlighter
        language="yaml"
        style={
          window.matchMedia('(prefers-color-scheme: dark)').matches
            ? materialDark
            : materialLight
        }
        showLineNumbers={true}
        wrapLines={true}
        lineNumberStyle={{
          paddingRight: '20px',
          color: '#888',
          minWidth: '40px',
          textAlign: 'right',
        }}
        customStyle={{
          margin: 0,
          padding: '20px',
          borderRadius: '4px',
          fontSize: '1rem',
          width: '100%',
        }}
      >
        {formattedYaml}
      </SyntaxHighlighter>
    </div>
  );
};

export default YamlViewer;
