import { Button, Panel, Toolbar } from '@ui5/webcomponents-react';
import * as monaco from 'monaco-editor';
import type { SchemasSettings } from 'monaco-yaml';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseDocument } from 'yaml';
import { useTheme } from '../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT } from '../../lib/monaco.ts';
import { schemaRegistry } from '../../lib/schemaRegistry.ts';
import styles from './YamlEditor.module.css';

import type { JSONSchema4 } from 'json-schema';

const KUBERNETES_SCHEMA_URI = 'https://kubernetesjsonschema.dev/master-standalone/all.json';

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
  const { isDarkTheme } = useTheme();
  const { t } = useTranslation();
  const instanceId = useId();
  const {
    options,
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
  const computedTheme = isDarkTheme ? GITHUB_DARK_DEFAULT : GITHUB_LIGHT_DEFAULT;

  // Stable, unique model URI for this editor instance.
  const modelUri = useMemo(
    () => monaco.Uri.parse(`inmemory://yaml/${instanceId}/${path ?? 'untitled'}.yaml`),
    [instanceId, path],
  );

  const [editorContent, setEditorContent] = useState<string>(value ?? '');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [applyAttempted, setApplyAttempted] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Register schema scoped to this editor's model URI; clean up on unmount.
  useEffect(() => {
    if (!schema || !isEdit) return;
    const uriStr = modelUri.toString();
    schemaRegistry.set(uriStr, { schema: schema as SchemasSettings['schema'], uri: KUBERNETES_SCHEMA_URI });
    return () => {
      schemaRegistry.delete(uriStr);
    };
  }, [schema, isEdit, modelUri]);

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
      copyWithSyntaxHighlighting: false,
    }),
    [options, isEdit],
  );

  const [schemaErrorCount, setSchemaErrorCount] = useState(0);
  const [schemaStale, setSchemaStale] = useState(false);

  const recomputeSchemaErrors = useCallback(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;
    const markers = monaco.editor.getModelMarkers({ resource: model.uri });
    const errors = markers.filter((m) => m.severity === monaco.MarkerSeverity.Error);
    setSchemaErrorCount(errors.length);
  }, []);

  // Create / dispose a unique model for this instance. The editor mounts after the model exists.
  const containerRef = useRef<HTMLDivElement>(null);
  const disposablesRef = useRef<monaco.IDisposable[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create a unique model for this editor instance.
    let model = monaco.editor.getModel(modelUri);
    if (model) {
      model.setValue(value ?? '');
    } else {
      model = monaco.editor.createModel(value ?? '', 'yaml', modelUri);
    }

    const editor = monaco.editor.create(container, {
      ...enforcedOptions,
      model,
      theme: computedTheme,
      language: 'yaml',
      automaticLayout: true,
    });

    editorRef.current = editor;

    const markerDisposable = monaco.editor.onDidChangeMarkers((uris) => {
      if (uris.some((u) => u.toString() === modelUri.toString())) {
        recomputeSchemaErrors();
      }
    });

    const contentDisposable = editor.onDidChangeModelContent(() => {
      const val = editor.getValue();
      if (isEdit) {
        setEditorContent(val);
        onContentChange?.(val);
        setSchemaStale(true);
      }
    });

    disposablesRef.current = [markerDisposable, contentDisposable];

    recomputeSchemaErrors();
    parentOnMount?.(editor, monaco);

    return () => {
      for (const d of disposablesRef.current) d.dispose();
      disposablesRef.current = [];
      editor.dispose();
      const m = monaco.editor.getModel(modelUri);
      m?.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUri]);

  // Update theme when it changes without recreating the editor.
  useEffect(() => {
    monaco.editor.setTheme(computedTheme);
  }, [computedTheme]);

  // Update value in view mode — apply as an edit to preserve scroll/folds (fix A8).
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isEdit) return;
    const model = editor.getModel();
    if (!model || model.getValue() === value) return;
    model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value ?? '' }], () => null);
  }, [value, isEdit]);

  // Clear the stale flag a short while after edits stop.
  useEffect(() => {
    const timer = setTimeout(() => setSchemaStale(false), 800);
    return () => clearTimeout(timer);
  }, [editorContent]);

  // Surface combined parse + schema validity to the parent.
  useEffect(() => {
    if (!onValidityChange) return;
    let parseOk = true;
    try {
      const doc = parseDocument(editorContent);
      parseOk = !doc.errors || doc.errors.length === 0;
    } catch {
      parseOk = false;
    }
    onValidityChange({ parseOk, schemaErrorCount, schemaStale });
  }, [editorContent, schemaErrorCount, schemaStale, onValidityChange]);

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
      <div ref={containerRef} className={styles.editorWrapper} />
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
