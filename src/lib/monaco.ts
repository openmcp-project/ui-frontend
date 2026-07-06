/* eslint-disable import/default */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';
import type { MonacoYaml, MonacoYamlOptions, SchemasSettings } from 'monaco-yaml';

import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

import YamlWorker from 'monaco-yaml/yaml.worker?worker';

// Use ESM monaco to avoid loading AMD loader from CDN
loader.config({ monaco });

export type { SchemasSettings };

const BASE_YAML_OPTIONS: MonacoYamlOptions = {
  isKubernetes: true,
  enableSchemaRequest: true,
  hover: true,
  completion: true,
  validate: true,
  format: { enable: true },
};

let monacoYamlInstance: MonacoYaml | undefined;

export const updateYamlSchemas = (schemas: SchemasSettings[]): void => {
  monacoYamlInstance?.update({ ...BASE_YAML_OPTIONS, schemas });
};

export const GITHUB_LIGHT_DEFAULT = 'github-light-default';
export const GITHUB_DARK_DEFAULT = 'github-dark-default';

const GITHUB_LIGHT_EDITOR_COLORS: monaco.editor.IColors = {
  'editor.foreground': '#1f2328',
  'editor.background': '#ffffff',
  'editorWidget.background': '#f6f8fa',
  'editor.lineHighlightBackground': '#eaeef2',
  'editorCursor.foreground': '#0969da',
  'editor.selectionBackground': '#0969da33',
  'editor.inactiveSelectionBackground': '#0969da12',
  'editor.selectionHighlightBackground': '#1a7f3740',
  'editorLineNumber.foreground': '#8c959f',
  'editorLineNumber.activeForeground': '#1f2328',
  'editorIndentGuide.background': '#1f23281f',
  'editorIndentGuide.activeBackground': '#1f23283d',
  'editorGutter.background': '#ffffff',
  'editorHoverWidget.background': '#f6f8fa',
  'editorHoverWidget.border': '#d0d7de',
  'editorSuggestWidget.background': '#f6f8fa',
  'editorSuggestWidget.border': '#d0d7de',
  'editorWidget.border': '#d0d7de',
  'editorWhitespace.foreground': '#d0d7de',
  'editor.wordHighlightBackground': '#afb8c180',
  'editor.wordHighlightStrongBackground': '#afb8c14d',
};

const GITHUB_DARK_EDITOR_COLORS: monaco.editor.IColors = {
  'editor.foreground': '#e6edf3',
  'editor.background': '#0d1117',
  'editorWidget.background': '#161b22',
  'editor.lineHighlightBackground': '#161b22',
  'editorCursor.foreground': '#2f81f7',
  'editor.selectionBackground': '#2f81f733',
  'editor.inactiveSelectionBackground': '#2f81f712',
  'editor.selectionHighlightBackground': '#2ea04340',
  'editorLineNumber.foreground': '#6e7681',
  'editorLineNumber.activeForeground': '#e6edf3',
  'editorIndentGuide.background': '#e6edf31f',
  'editorIndentGuide.activeBackground': '#e6edf33d',
  'editorGutter.background': '#0d1117',
  'editorHoverWidget.background': '#161b22',
  'editorHoverWidget.border': '#30363d',
  'editorSuggestWidget.background': '#161b22',
  'editorSuggestWidget.border': '#30363d',
  'editorWidget.border': '#30363d',
  'editorWhitespace.foreground': '#484f58',
  'editor.wordHighlightBackground': '#6e768180',
  'editor.wordHighlightStrongBackground': '#6e76814d',
};

export const configureMonaco = () => {
  // Route YAML language to monaco-yaml worker, everything else to the default editor worker
  if (typeof window !== 'undefined') {
    window.MonacoEnvironment = {
      getWorker: (_moduleId: string, label: string): Worker => {
        if (label === 'yaml') {
          return new YamlWorker();
        }
        return new EditorWorker();
      },
    };
  }

  // Monaco 0.55 changed createWebWorker to require opts.worker (Worker instance) instead
  // of opts.label/moduleId/createData. monaco-worker-manager still uses the old API, so
  // we intercept the call, create the YamlWorker ourselves, and inject createData as the
  // first postMessage (before Monaco's own '-please-ignore-') so our worker shim can read it.
  const _originalCreateWebWorker = monaco.editor.createWebWorker.bind(monaco.editor);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (monaco.editor as Record<string, any>).createWebWorker = (opts: Record<string, any>) => {
    if (opts.label === 'yaml') {
      const worker = new YamlWorker();
      // Send createData first so the compat shim receives it before '-please-ignore-'.
      worker.postMessage(opts.createData ?? {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (_originalCreateWebWorker as (opts: any) => any)({ worker });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_originalCreateWebWorker as (opts: any) => any)(opts);
  };

  // Initialize the YAML language service before any editor mounts.
  // monaco-yaml only supports one instance at a time; editors call updateYamlSchemas()
  // to change the active schema without recreating the service.
  monacoYamlInstance = configureMonacoYaml(monaco, BASE_YAML_OPTIONS);

  monaco.editor.defineTheme(GITHUB_LIGHT_DEFAULT, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: GITHUB_LIGHT_EDITOR_COLORS,
  });

  monaco.editor.defineTheme(GITHUB_DARK_DEFAULT, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: GITHUB_DARK_EDITOR_COLORS,
  });
};
