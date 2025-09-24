import { FC, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { diffLines } from 'diff';
import styles from './YamlDiff.module.css';
import { useTheme } from '../../hooks/useTheme.ts';

type YamlDiffProps = {
  originalYaml: string;
  modifiedYaml: string;
};

export const YamlDiff: FC<YamlDiffProps> = ({ originalYaml, modifiedYaml }) => {
  const { isDarkTheme } = useTheme();

  const hunks = useMemo(() => diffLines(originalYaml ?? '', modifiedYaml ?? ''), [originalYaml, modifiedYaml]);

  const { content, lineKinds } = useMemo(() => {
    const lines: string[] = [];
    const kinds: ('added' | 'removed' | 'context')[] = [];
    hunks.forEach((part) => {
      const prefix = part.added ? '+' : part.removed ? '-' : ' ';
      const kind: 'added' | 'removed' | 'context' = part.added ? 'added' : part.removed ? 'removed' : 'context';
      const partLines = part.value.replace(/\n$/, '').split('\n');
      partLines.forEach((line) => {
        lines.push(`${prefix}${line}`);
        kinds.push(kind);
      });
    });
    return { content: lines.join('\n'), lineKinds: kinds };
  }, [hunks]);

  const lineNumberStyle = useMemo(() => ({ paddingRight: '20px', minWidth: '40px', textAlign: 'right' as const }), []);

  return (
    <div className={styles.container}>
      <SyntaxHighlighter
        language="diff"
        style={isDarkTheme ? materialDark : materialLight}
        showLineNumbers
        wrapLongLines
        lineNumberStyle={lineNumberStyle}
        lineProps={(lineNumber) => {
          const kind = lineKinds[lineNumber - 1];
          if (kind === 'added') return { className: styles.added };
          if (kind === 'removed') return { className: styles.removed };
          return {};
        }}
        customStyle={{ margin: 0, padding: '20px', borderRadius: '4px', fontSize: '1rem', background: 'transparent' }}
        codeTagProps={{ style: { whiteSpace: 'pre-wrap' } }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};
