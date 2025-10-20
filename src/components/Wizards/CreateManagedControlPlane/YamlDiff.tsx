import { FC } from 'react';

import styles from './YamlDiff.module.css';
import { YamlDiffEditor } from '../../YamlEditor/YamlDiffEditor.tsx';
import cx from 'clsx';
type YamlDiffProps = {
  originalYaml: string;
  modifiedYaml: string;
  absolutePosition?: boolean;
};

export const YamlDiff: FC<YamlDiffProps> = ({ originalYaml, modifiedYaml, absolutePosition = false }) => {
  return (
    <div className={cx(styles.container, { [styles.absolutePosition]: absolutePosition })}>
      <YamlDiffEditor original={originalYaml} modified={modifiedYaml} />
    </div>
  );
};
