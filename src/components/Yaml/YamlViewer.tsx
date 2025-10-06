import { FC } from 'react';

import { YamlEditor } from '../YamlEditor/YamlEditor';

import styles from './YamlViewer.module.css';

type YamlViewerProps = {
  yamlString: string;
  filename: string;
  isEdit?: boolean;
};

export const YamlViewer: FC<YamlViewerProps> = ({ yamlString, filename, isEdit = false }) => {
  return (
    <div className={styles.container}>
      <YamlEditor value={yamlString} path={`${filename}.yaml`} isEdit={isEdit} options={{ readOnly: !isEdit }} />
    </div>
  );
};
