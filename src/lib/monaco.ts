/* eslint-disable import/default */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Register YAML basic language (syntax highlighting only) to avoid LSP worker integration
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Use ESM monaco to avoid loading AMD loader from CDN
loader.config({ monaco });

export const GITHUB_LIGHT_DEFAULT = 'github-light-default';
export const GITHUB_DARK_DEFAULT = 'github-dark-default';

// Lightweight RGBA helper
function rgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const v =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const n = parseInt(v, 16);
  // If parse fails, fallback to transparent
  if (Number.isNaN(n)) return `rgba(0,0,0,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Inlined GitHub Light Default editor colors (subset focused on Monaco editor UI)
const GITHUB_LIGHT_EDITOR_COLORS: monaco.editor.IColors = {
  'editor.foreground': '#1f2328',
  'editor.background': '#ffffff',
  'editorWidget.background': '#f6f8fa',
  'editor.lineHighlightBackground': '#eaeef2',
  'editorCursor.foreground': '#0969da',
  'editor.selectionBackground': rgba('#0969da', 0.2),
  'editor.inactiveSelectionBackground': rgba('#0969da', 0.07),
  'editor.selectionHighlightBackground': rgba('#1a7f37', 0.25),
  'editorLineNumber.foreground': '#8c959f',
  'editorLineNumber.activeForeground': '#1f2328',
  'editorIndentGuide.background': rgba('#1f2328', 0.12),
  'editorIndentGuide.activeBackground': rgba('#1f2328', 0.24),
  'editorGutter.background': '#ffffff',
  'editorHoverWidget.background': '#f6f8fa',
  'editorHoverWidget.border': '#d0d7de',
  'editorSuggestWidget.background': '#f6f8fa',
  'editorSuggestWidget.border': '#d0d7de',
  'editorWidget.border': '#d0d7de',
  'editorWhitespace.foreground': '#d0d7de',
  'editor.wordHighlightBackground': rgba('#afb8c1', 0.5),
  'editor.wordHighlightStrongBackground': rgba('#afb8c1', 0.3),
};

// Inlined GitHub Dark Default editor colors (subset focused on Monaco editor UI)
const GITHUB_DARK_EDITOR_COLORS: monaco.editor.IColors = {
  'editor.foreground': '#e6edf3',
  'editor.background': '#0d1117',
  'editorWidget.background': '#161b22',
  'editor.lineHighlightBackground': '#161b22',
  'editorCursor.foreground': '#2f81f7',
  'editor.selectionBackground': rgba('#2f81f7', 0.2),
  'editor.inactiveSelectionBackground': rgba('#2f81f7', 0.07),
  'editor.selectionHighlightBackground': rgba('#2ea043', 0.25),
  'editorLineNumber.foreground': '#6e7681',
  'editorLineNumber.activeForeground': '#e6edf3',
  'editorIndentGuide.background': rgba('#e6edf3', 0.12),
  'editorIndentGuide.activeBackground': rgba('#e6edf3', 0.24),
  'editorGutter.background': '#0d1117',
  'editorHoverWidget.background': '#161b22',
  'editorHoverWidget.border': '#30363d',
  'editorSuggestWidget.background': '#161b22',
  'editorSuggestWidget.border': '#30363d',
  'editorWidget.border': '#30363d',
  'editorWhitespace.foreground': '#484f58',
  'editor.wordHighlightBackground': rgba('#6e7681', 0.5),
  'editor.wordHighlightStrongBackground': rgba('#6e7681', 0.3),
};

export const configureMonaco = () => {
  self.MonacoEnvironment = {
    getWorker: (_: string) => new EditorWorker(),
  };

  // Register GitHub Light Default
  monaco.editor.defineTheme(GITHUB_LIGHT_DEFAULT, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: GITHUB_LIGHT_EDITOR_COLORS,
  });

  // Register GitHub Dark Default
  monaco.editor.defineTheme(GITHUB_DARK_DEFAULT, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: GITHUB_DARK_EDITOR_COLORS,
  });
};
