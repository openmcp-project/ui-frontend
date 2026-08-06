/* eslint-disable import/default */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';
import type { MonacoYaml, MonacoYamlOptions, SchemasSettings } from 'monaco-yaml';

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

  // monaco-worker-manager calls createWebWorker with the pre-0.55 shape (label/moduleId/createData).
  // Monaco 0.55+ only accepts { worker: Worker }. We intercept yaml calls, spawn the worker
  // ourselves, and prime it with createData before Monaco sends its own '-please-ignore-' message
  // so the compat shim in monaco-worker-manager-compat.ts can read it.
  type LegacyWebWorkerOptions = monaco.editor.IInternalWebWorkerOptions & {
    label?: string;
    moduleId?: string;
    createData?: unknown;
  };
  type CreateWebWorker = <T extends object>(opts: LegacyWebWorkerOptions) => monaco.editor.MonacoWebWorker<T>;
  const originalCreateWebWorker = monaco.editor.createWebWorker.bind(monaco.editor) as CreateWebWorker;
  (monaco.editor as unknown as { createWebWorker: CreateWebWorker }).createWebWorker = (opts) => {
    if (opts.label === 'yaml') {
      const worker = new YamlWorker();
      worker.postMessage(opts.createData ?? {});
      return originalCreateWebWorker({ worker });
    }
    return originalCreateWebWorker(opts);
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
