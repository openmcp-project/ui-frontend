/* eslint-disable import/default */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Register YAML basic language (syntax highlighting only) to avoid LSP worker integration
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Use ESM monaco to avoid loading AMD loader from CDN
loader.config({ monaco });

export const VS_CODE_LIGHT_PLUS = 'vscode-light-plus';
export const VS_CODE_DARK_PLUS = 'vscode-dark-plus';

export const configureMonaco = () => {
  self.MonacoEnvironment = {
    getWorker: (_: string, label: string) => {
      if (label === 'json') {
        return new JsonWorker();
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new CssWorker();
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new HtmlWorker();
      }
      if (label === 'typescript' || label === 'javascript') {
        return new TsWorker();
      }
      return new EditorWorker();
    },
  };

  // Define VS Code-like themes (Light+ and Dark+) by extending Monaco's built-ins
  // Values chosen mirror VS Code defaults for key editor colors; we inherit all other colors.
  monaco.editor.defineTheme(VS_CODE_DARK_PLUS, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      // Core editor surface
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2a2a2a',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41',
      'editor.selectionHighlightBackground': '#ADD6FF26',
      'editor.wordHighlightBackground': '#575757B8',
      'editor.wordHighlightStrongBackground': '#004972B8',
      'editorCursor.foreground': '#aeafad',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editorGutter.background': '#1e1e1e',
      // Widgets
      'editorWidget.background': '#252526',
      'editorWidget.border': '#454545',
      'editorSuggestWidget.background': '#252526',
      'editorSuggestWidget.border': '#454545',
      'editorHoverWidget.background': '#252526',
      'editorHoverWidget.border': '#454545',
    },
  });

  monaco.editor.defineTheme(VS_CODE_LIGHT_PLUS, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#333333',
      'editor.lineHighlightBackground': '#F0F0F0',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
      'editor.selectionHighlightBackground': '#ADD6FF40',
      'editor.wordHighlightBackground': '#57575740',
      'editor.wordHighlightStrongBackground': '#00497240',
      'editorCursor.foreground': '#000000',
      'editorLineNumber.foreground': '#23789380',
      'editorLineNumber.activeForeground': '#0B216F',
      'editorIndentGuide.background': '#d3d3d3',
      'editorIndentGuide.activeBackground': '#939393',
      'editorGutter.background': '#ffffff',
      'editorWidget.background': '#F3F3F3',
      'editorWidget.border': '#C8C8C8',
      'editorSuggestWidget.background': '#F3F3F3',
      'editorSuggestWidget.border': '#C8C8C8',
      'editorHoverWidget.background': '#F3F3F3',
      'editorHoverWidget.border': '#C8C8C8',
    },
  });
};
