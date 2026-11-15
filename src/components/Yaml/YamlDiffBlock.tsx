import { useMemo } from 'react';
import { Toolbar, Title, ToolbarSpacer } from '@ui5/webcomponents-react';
import { YamlCodeDiff } from './core/YamlCodeDiff.tsx';
import cx from 'clsx';
import styles from './YamlDiffBlock.module.css';

export interface YamlDiffBlockProps {
  original: string;
  modified: string;
  title?: string;
  size?: 'fill' | number;
}

export function YamlDiffBlock({ original, modified, title, size = 'fill' }: YamlDiffBlockProps) {
  const hasHeader = !!title;

  const rootStyle = useMemo(() => (typeof size === 'number' ? { height: `${size}px` } : undefined), [size]);

  return (
    <div
      className={cx(styles.root, {
        [styles.rootFill]: size === 'fill',
      })}
      style={rootStyle}
    >
      {hasHeader && (
        <Toolbar className={styles.header}>
          <Title level="H5">{title}</Title>
          <ToolbarSpacer />
        </Toolbar>
      )}
      <div className={styles.body}>
        <YamlCodeDiff original={original} modified={modified} />
      </div>
    </div>
  );
}
