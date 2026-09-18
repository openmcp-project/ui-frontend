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
  hideToolbar?: boolean;
  onValidityChange?: (validity: { parseOk: boolean; schemaErrorCount: number }) => void;
  onContentChange?: (yaml: string) => void;
}

export const YamlViewer: FC<YamlViewerProps> = ({
  yamlString,
  filename,
  isEdit = false,
  onApply,
  schema,
  height,
  hideToolbar,
  onValidityChange,
  onContentChange,
}) => {
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
        hideToolbar={hideToolbar}
        onApply={onApply}
        onValidityChange={onValidityChange}
        onContentChange={onContentChange}
      />
    </div>
  );
};
