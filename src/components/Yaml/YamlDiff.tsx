import { FC } from 'react';

import styles from './YamlDiff.module.css';
import { YamlCodeDiff } from './core/YamlCodeDiff.tsx';
import cx from 'clsx';
type YamlDiffProps = {
  originalYaml: string;
  modifiedYaml: string;
  absolutePosition?: boolean;
};

export const YamlDiff: FC<YamlDiffProps> = ({ originalYaml, modifiedYaml, absolutePosition = false }) => {
  return (
    <div className={cx(styles.container, { [styles.absolutePosition]: absolutePosition })}>
      <YamlCodeDiff original={originalYaml} modified={modifiedYaml} />
    </div>
  );
};
