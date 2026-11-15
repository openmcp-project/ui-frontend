import { Button, Panel, Toolbar } from '@ui5/webcomponents-react';
import * as monaco from 'monaco-editor';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseDocument } from 'yaml';
import { YamlCodeEditor } from '../Yaml/core/YamlCodeEditor';
import styles from './YamlEditor.module.css';

import type { JSONSchema4 } from 'json-schema';

export type YamlEditorProps = {
  value?: string;
  path?: string;
  isEdit?: boolean;
  onApply?: (parsed: unknown, yaml: string) => void;
  schema?: JSONSchema4;
  /** Hide the built-in "Apply changes" toolbar (used when an external footer drives the apply). */
  hideToolbar?: boolean;
  /** Emitted whenever the parse/schema validity of the current content changes. */
  onValidityChange?: (validity: { parseOk: boolean; schemaErrorCount: number; schemaStale?: boolean }) => void;
  /** Emitted with the raw editor text whenever it changes (edit mode only). */
  onContentChange?: (yaml: string) => void;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  height?: string;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => void;
};

export const YamlEditor = (props: YamlEditorProps) => {
  const { t } = useTranslation();
  const {
    value,
    path,
    isEdit = false,
    onApply,
    onMount: parentOnMount,
    schema,
    hideToolbar = false,
    onValidityChange,
    onContentChange,
  } = props;

  const [editorContent, setEditorContent] = useState<string>(value ?? '');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [applyAttempted, setApplyAttempted] = useState(false);

  const handleChange = useCallback(
    (yaml: string) => {
      setEditorContent(yaml);
      onContentChange?.(yaml);
    },
    [onContentChange],
  );

  const handleMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      parentOnMount?.(editor, monaco);
    },
    [parentOnMount],
  );

  const handleApply = useCallback(() => {
    const run = async () => {
      setApplyAttempted(true);
      try {
        const doc = parseDocument(editorContent);
        if (doc.errors && doc.errors.length) {
          setValidationErrors(doc.errors.map((e) => e.message));
          return;
        }
        setValidationErrors([]);
        const jsObj = doc.toJS();
        if (onApply) {
          await onApply(jsObj, editorContent);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setValidationErrors([e.message]);
        } else {
          setValidationErrors(['Unknown YAML parse error']);
        }
      }
    };
    run();
  }, [editorContent, onApply]);

  const showValidationErrors = isEdit && applyAttempted && validationErrors.length > 0;

  return (
    <div className={styles.container}>
      {isEdit && !hideToolbar && (
        <Toolbar design="Solid">
          <Button
            className={styles.applyButton}
            design="Emphasized"
            data-testid="yaml-apply-button"
            onClick={handleApply}
          >
            {t('buttons.applyChanges')}
          </Button>
        </Toolbar>
      )}
      <div className={styles.editorWrapper}>
        <YamlCodeEditor
          value={value ?? ''}
          filename={path ?? 'untitled'}
          mode={isEdit ? 'edit' : 'view'}
          schema={schema}
          onChange={handleChange}
          onValidityChange={onValidityChange}
          onMount={handleMount}
        />
      </div>
      {showValidationErrors && (
        <Panel headerText={t('yaml.validationErrors')} className={styles.validationPanel}>
          <ul className={styles.validationList}>
            {validationErrors.map((err, idx) => (
              <li key={idx} className={styles.validationListItem}>
                {err}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
};
