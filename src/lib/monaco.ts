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
export const configureMonaco = () => {
  self.MonacoEnvironment = {
    getWorker: (_: string) => {
      return new EditorWorker();
    },
  };
};
