import { FC, useMemo } from 'react';
import { diffLines } from 'diff';
import styles from './YamlDiff.module.css';

type YamlDiffProps = {
  originalYaml: string;
  modifiedYaml: string;
};

export const YamlDiff: FC<YamlDiffProps> = ({ originalYaml, modifiedYaml }) => {
  const hunks = useMemo(() => diffLines(originalYaml ?? '', modifiedYaml ?? ''), [originalYaml, modifiedYaml]);

  const { lines, lineKinds } = useMemo(() => {
    const _lines: string[] = [];
    const kinds: ('added' | 'removed' | 'context')[] = [];
    hunks.forEach((part) => {
      const prefix = part.added ? '+' : part.removed ? '-' : ' ';
      const kind: 'added' | 'removed' | 'context' = part.added ? 'added' : part.removed ? 'removed' : 'context';
      const partLines = part.value.replace(/\n$/, '').split('\n');
      partLines.forEach((line) => {
        _lines.push(`${prefix}${line}`);
        kinds.push(kind);
      });
    });
    return { lines: _lines, lineKinds: kinds };
  }, [hunks]);

  const lineNumberStyle: React.CSSProperties = useMemo(
    () => ({ paddingRight: 20, minWidth: 40, textAlign: 'right', opacity: 0.7 }),
    [],
  );

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      margin: 0,
      padding: 20,
      borderRadius: 4,
      fontSize: '1rem',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      background: 'transparent',
      whiteSpace: 'pre-wrap',
    }),
    [],
  );

  return (
    <div className={styles.container}>
      <div style={containerStyle}>
        {lines.map((text, idx) => {
          const kind = lineKinds[idx];
          const className = kind === 'added' ? styles.added : kind === 'removed' ? styles.removed : undefined;
          return (
            <div key={idx} className={className} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12 }}>
              <span style={lineNumberStyle}>{idx + 1}</span>
              <span>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
