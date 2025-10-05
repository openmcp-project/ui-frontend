import { FC } from 'react';

import styles from './YamlDiff.module.css';
import { YamlDiffEditor } from '../../YamlEditor/YamlDiffEditor.tsx';
type YamlDiffProps = {
  originalYaml: string;
  modifiedYaml: string;
};

export const YamlDiff: FC<YamlDiffProps> = ({ originalYaml, modifiedYaml }) => {
  return (
    <div className={styles.container}>
      <YamlDiffEditor original={originalYaml} modified={modifiedYaml} />
    </div>
  );
};
