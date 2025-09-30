/* eslint-disable import/default */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import YamlWorker from 'monaco-yaml/yaml.worker?worker';

// Use ESM monaco to avoid loading AMD loader from CDN
loader.config({ monaco });

export const configureMonaco = () => {
  self.MonacoEnvironment = {
    getWorker: (_: string, label: string) => {
      if (label === 'yaml') {
        return new YamlWorker();
      }
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
};

export const configureYaml = (m: typeof monaco) => {
  configureMonacoYaml(m, {
    enableSchemaRequest: true,
    hover: true,
    completion: true,
    validate: true,
    format: true,
    schemas: [
      {
        fileMatch: ['*'],
        uri: 'https://raw.githubusercontent.com/datreeio/datree/main/datree/json-schema/k8s-schema.json',
      },
    ],
  });
};
