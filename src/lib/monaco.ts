/* eslint-disable import/default */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

import YamlWorker from 'monaco-yaml/yaml.worker?worker';

// Use ESM monaco to avoid loading AMD loader from CDN
loader.config({ monaco });

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
