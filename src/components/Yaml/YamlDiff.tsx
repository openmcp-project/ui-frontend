import { FC } from 'react';

import { YamlDiffEditor } from '../YamlEditor/YamlDiffEditor.tsx';
import styles from './YamlDiff.module.css';
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
