import * as monaco from 'monaco-editor';
import { useEffect, useId, useMemo, useRef } from 'react';
import { useTheme } from '../../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT } from '../monaco/theme';
import { DIFF_OPTIONS } from '../monaco/presets';

export interface YamlCodeDiffProps {
  original: string;
  modified: string;
  height?: string;
}

export const YamlCodeDiff = ({ original, modified, height }: YamlCodeDiffProps) => {
  const { isDarkTheme } = useTheme();
  const instanceId = useId();
  const computedTheme = isDarkTheme ? GITHUB_DARK_DEFAULT : GITHUB_LIGHT_DEFAULT;
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);

  const originalUri = useMemo(() => monaco.Uri.parse(`inmemory://yaml/${instanceId}/original.yaml`), [instanceId]);
  const modifiedUri = useMemo(() => monaco.Uri.parse(`inmemory://yaml/${instanceId}/modified.yaml`), [instanceId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const originalModel = monaco.editor.createModel(original, 'yaml', originalUri);
    const modifiedModel = monaco.editor.createModel(modified, 'yaml', modifiedUri);

    const diffEditor = monaco.editor.createDiffEditor(container, {
      ...DIFF_OPTIONS,
      theme: computedTheme,
    });

    diffEditor.setModel({ original: originalModel, modified: modifiedModel });
    editorRef.current = diffEditor;

    return () => {
      // Dispose in the correct order: editor first, then models.
      // This prevents the "TextModel got disposed before DiffEditorWidget model got reset" error.
      diffEditor.dispose();
      originalModel.dispose();
      modifiedModel.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUri, modifiedUri]);

  // Update content when props change without recreating the editor.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (model?.original && model.original.getValue() !== original) {
      model.original.setValue(original);
    }
    if (model?.modified && model.modified.getValue() !== modified) {
      model.modified.setValue(modified);
    }
  }, [original, modified]);

  // Update theme when it changes.
  useEffect(() => {
    monaco.editor.setTheme(computedTheme);
  }, [computedTheme]);

  return <div ref={containerRef} style={{ width: '100%', height: height ?? '100%' }} />;
};
