import React, { FC } from 'react';

import { YamlEditor } from '../YamlEditor/YamlEditor';

import styles from './YamlViewer.module.css';

import type { JSONSchema4 } from 'json-schema';

export interface YamlViewerProps {
  yamlString: string;
  filename: string;
  isEdit?: boolean;
  onApply?: (parsed: unknown, yaml: string) => void | boolean | Promise<void | boolean>;
  schema?: JSONSchema4;
  height?: string;
}

export const YamlViewer: FC<YamlViewerProps> = ({ yamlString, filename, isEdit = false, onApply, schema, height }) => {
  return (
    <div
      className={styles.container}
      style={height ? ({ '--yaml-viewer-height': height } as React.CSSProperties) : undefined}
    >
      <YamlEditor
        value={yamlString}
        path={`${filename}.yaml`}
        isEdit={isEdit}
        options={{ readOnly: !isEdit }}
        schema={schema}
        onApply={onApply}
      />
    </div>
  );
};
