import { FC } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import styles from './YamlViewer.module.css';
import { useTheme } from '../../hooks/useTheme.ts';
type YamlViewerProps = {
  yamlString: string;
};

export const YamlViewer: FC<YamlViewerProps> = ({ yamlString }) => {
  const { isDarkTheme } = useTheme();

  return (
    <div className={styles.container}>
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
