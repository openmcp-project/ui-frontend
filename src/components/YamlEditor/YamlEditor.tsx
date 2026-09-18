import { Editor } from '@monaco-editor/react';
import { Button, Panel, Toolbar } from '@ui5/webcomponents-react';
import * as monaco from 'monaco-editor';
import type { SchemasSettings } from 'monaco-yaml';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseDocument } from 'yaml';
import { useTheme } from '../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT, updateYamlSchemas } from '../../lib/monaco.ts';
import styles from './YamlEditor.module.css';

import type { JSONSchema4 } from 'json-schema';

const KUBERNETES_SCHEMA_URI = 'https://kubernetesjsonschema.dev/master-standalone/all.json';

export type YamlEditorProps = Omit<ComponentProps<typeof Editor>, 'language'> & {
  isEdit?: boolean;
  onApply?: (parsed: unknown, yaml: string) => void;
  schema?: JSONSchema4;
  /** Hide the built-in "Apply changes" toolbar (used when an external footer drives the apply). */
  hideToolbar?: boolean;
  /** Emitted whenever the parse/schema validity of the current content changes. */
  onValidityChange?: (validity: { parseOk: boolean; schemaErrorCount: number }) => void;
  /** Emitted with the raw editor text whenever it changes (edit mode only). */
  onContentChange?: (yaml: string) => void;
};

export const YamlEditor = (props: YamlEditorProps) => {
  const { isDarkTheme } = useTheme();
  const { t } = useTranslation();
  const {
    theme,
    options,
    value,
    defaultValue,
    onChange,
    isEdit = false,
    onApply,
    onMount: parentOnMount,
    schema,
    hideToolbar = false,
    onValidityChange,
    onContentChange,
    ...rest
  } = props;
  const computedTheme = theme ?? (isDarkTheme ? GITHUB_DARK_DEFAULT : GITHUB_LIGHT_DEFAULT);

  const [editorContent, setEditorContent] = useState<string>(value?.toString() ?? defaultValue?.toString() ?? '');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [applyAttempted, setApplyAttempted] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  useEffect(() => {
    const schemas: SchemasSettings[] = schema
      ? [{ schema: schema as SchemasSettings['schema'], fileMatch: ['*'], uri: KUBERNETES_SCHEMA_URI }]
      : [];
    updateYamlSchemas(schemas);
  }, [schema]);

  const enforcedOptions: monaco.editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      ...(options as monaco.editor.IStandaloneEditorConstructionOptions),
      readOnly: isEdit ? false : (options?.readOnly ?? true),
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      wordWrap: 'on',
      folding: true,
      foldingStrategy: 'indentation',
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      suggestOnTriggerCharacters: true,
      glyphMargin: true,
      formatOnPaste: true,
      formatOnType: true,
      fontSize: 13,
      lineHeight: 20,
      contextmenu: false,
    }),
    [options, isEdit],
  );

  const handleEditorChange = useCallback(
    (val: string | undefined, event?: monaco.editor.IModelContentChangedEvent) => {
      if (isEdit) {
        setEditorContent(val ?? '');
        onContentChange?.(val ?? '');
      }
      if (event) {
        onChange?.(val ?? '', event);
      }
    },
    [isEdit, onChange, onContentChange],
  );

  const [schemaErrorCount, setSchemaErrorCount] = useState(0);

  const recomputeSchemaErrors = useCallback(() => {
    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monacoInstance || !model) return;
    const markers = monacoInstance.editor.getModelMarkers({ resource: model.uri });
    const errors = markers.filter((m) => m.severity === monacoInstance.MarkerSeverity.Error);
    setSchemaErrorCount(errors.length);
  }, []);

  const handleMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
      editorRef.current = editor;
      monacoRef.current = monacoInstance;
      const disposable = monacoInstance.editor.onDidChangeMarkers((uris) => {
        const model = editor.getModel();
        if (model && uris.some((u) => u.toString() === model.uri.toString())) {
          recomputeSchemaErrors();
        }
      });
      editor.onDidDispose(() => disposable.dispose());
      recomputeSchemaErrors();
      parentOnMount?.(editor, monacoInstance);
    },
    [parentOnMount, recomputeSchemaErrors],
  );

  // Surface combined parse + schema validity to the parent (single source of truth for
  // external footer buttons that gate on YAML validity).
  useEffect(() => {
    if (!onValidityChange) return;
    let parseOk = true;
    try {
      const doc = parseDocument(editorContent);
      parseOk = !doc.errors || doc.errors.length === 0;
    } catch {
      parseOk = false;
    }
    onValidityChange({ parseOk, schemaErrorCount });
  }, [editorContent, schemaErrorCount, onValidityChange]);

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
        <Editor
          {...rest}
          value={isEdit ? editorContent : value}
          theme={computedTheme}
          options={enforcedOptions}
          height="100%"
          language="yaml"
          onChange={handleEditorChange}
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
