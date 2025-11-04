import { FC } from 'react';

import { YamlEditor } from '../YamlEditor/YamlEditor';

import styles from './YamlViewer.module.css';

export type YamlViewerProps = {
  yamlString: string;
  filename: string;
  isEdit?: boolean;
  onApply?: (parsed: unknown, yaml: string) => void | boolean | Promise<void | boolean>;
};

export const YamlViewer: FC<YamlViewerProps> = ({ yamlString, filename, isEdit = false, onApply }) => {
  return (
    <div className={styles.container}>
      <YamlEditor
        value={yamlString}
        path={`${filename}.yaml`}
        isEdit={isEdit}
        options={{ readOnly: !isEdit }}
        onApply={onApply}
      />
    </div>
  );
};
