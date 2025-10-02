import { FC } from 'react';

import { YamlEditor } from '../YamlEditor/YamlEditor';

import styles from './YamlViewer.module.css';

type YamlViewerProps = {
  yamlString: string;
  filename: string;
};

export const YamlViewer: FC<YamlViewerProps> = ({ yamlString, filename }) => {
  return (
    <div className={styles.container}>
      {/* Use controlled value with a stable model path to update content without remounting */}

      <YamlEditor value={yamlString} path={`${filename}.yaml`} options={{ readOnly: true }} />
    </div>
  );
};
