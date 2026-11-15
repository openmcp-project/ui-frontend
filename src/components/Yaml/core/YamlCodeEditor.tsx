import * as monaco from 'monaco-editor';
import type { SchemasSettings } from 'monaco-yaml';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT } from '../monaco/theme';
import { EDIT_OPTIONS, VIEW_OPTIONS } from '../monaco/presets';
import { schemaRegistry } from '../monaco/schemaRegistry';
import { ensureMonacoSetup } from '../monaco/setup';
import { useYamlValidity } from './useYamlValidity';

import type { JSONSchema4 } from 'json-schema';

const KUBERNETES_SCHEMA_URI = 'https://kubernetesjsonschema.dev/master-standalone/all.json';

export interface YamlCodeEditorProps {
  value: string;
  filename: string;
  mode?: 'view' | 'edit';
  schema?: JSONSchema4;
  onChange?: (yaml: string) => void;
  onValidityChange?: (v: { parseOk: boolean; schemaErrorCount: number; schemaStale?: boolean }) => void;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  height?: string;
}

export const YamlCodeEditor = ({
  value,
  filename,
  mode = 'view',
  schema,
  onChange,
  onValidityChange,
  onMount: parentOnMount,
  height,
}: YamlCodeEditorProps) => {
  const { isDarkTheme } = useTheme();
  const instanceId = useId();
  const isEdit = mode === 'edit';
  const computedTheme = isDarkTheme ? GITHUB_DARK_DEFAULT : GITHUB_LIGHT_DEFAULT;

  const modelUri = useMemo(
    () => monaco.Uri.parse(`inmemory://yaml/${instanceId}/${filename ?? 'untitled'}.yaml`),
    [instanceId, filename],
  );

  const [editorContent, setEditorContent] = useState<string>(value ?? '');
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const disposablesRef = useRef<monaco.IDisposable[]>([]);

  // Register schema scoped to this editor's model URI; clean up on unmount.
  useEffect(() => {
    if (!schema || !isEdit) return;
    const uriStr = modelUri.toString();
    schemaRegistry.set(uriStr, { schema: schema as SchemasSettings['schema'], uri: KUBERNETES_SCHEMA_URI });
    return () => {
      schemaRegistry.delete(uriStr);
    };
  }, [schema, isEdit, modelUri]);

  const presetOptions = isEdit ? EDIT_OPTIONS : VIEW_OPTIONS;

  const validity = useYamlValidity(editorContent, modelUri);

  // Surface validity to parent.
  useEffect(() => {
    onValidityChange?.(validity);
  }, [validity, onValidityChange]);

  // Create / dispose the editor.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    ensureMonacoSetup();

    let model = monaco.editor.getModel(modelUri);
    if (model) {
      model.setValue(value ?? '');
    } else {
      model = monaco.editor.createModel(value ?? '', 'yaml', modelUri);
    }

    const editor = monaco.editor.create(container, {
      ...presetOptions,
      model,
      theme: computedTheme,
      language: 'yaml',
      automaticLayout: true,
    });

    editorRef.current = editor;

    const contentDisposable = editor.onDidChangeModelContent(() => {
      const val = editor.getValue();
      if (isEdit) {
        setEditorContent(val);
        onChange?.(val);
      }
    });

    disposablesRef.current = [contentDisposable];

    parentOnMount?.(editor);

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

  // Update value in view mode — apply as an edit to preserve scroll/folds.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isEdit) return;
    const model = editor.getModel();
    if (!model || model.getValue() === value) return;
    model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value ?? '' }], () => null);
  }, [value, isEdit]);

  return <div ref={containerRef} style={{ width: '100%', height: height ?? '100%' }} />;
};
