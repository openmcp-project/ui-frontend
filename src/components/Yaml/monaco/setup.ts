/* eslint-disable import/default */
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';
import type { MonacoYaml, MonacoYamlOptions, SchemasSettings } from 'monaco-yaml';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

import YamlWorker from 'monaco-yaml/yaml.worker?worker';

import {
  GITHUB_DARK_DEFAULT,
  GITHUB_DARK_EDITOR_COLORS,
  GITHUB_LIGHT_DEFAULT,
  GITHUB_LIGHT_EDITOR_COLORS,
} from './theme';

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
let initialized = false;

export const updateYamlSchemas = (schemas: SchemasSettings[]): void => {
  monacoYamlInstance?.update({ ...BASE_YAML_OPTIONS, schemas });
};

export const ensureMonacoSetup = () => {
  if (initialized) return;
  initialized = true;

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

  // monaco-worker-manager (via monaco-yaml) still calls createWebWorker with the pre-0.53 shape
  // { moduleId, label, createData }; Monaco 0.53 (microsoft/vscode#244117) made it require a ready
  // { worker }. Without this adapter the yaml worker never wires up and calls fail with
  // "Missing requestHandler or method: …". Pattern from remcohaszing/monaco-yaml#272.
  type LegacyWebWorkerOptions = monaco.editor.IInternalWebWorkerOptions & {
    label?: string;
    moduleId?: string;
    createData?: unknown;
  };
  type CreateWebWorker = <T extends object>(opts: LegacyWebWorkerOptions) => monaco.editor.MonacoWebWorker<T>;
  const originalCreateWebWorker = monaco.editor.createWebWorker.bind(monaco.editor) as CreateWebWorker;
  (monaco.editor as unknown as { createWebWorker: CreateWebWorker }).createWebWorker = (opts) => {
    if ('worker' in opts && opts.worker) {
      return originalCreateWebWorker(opts);
    }
    const spawned = window.MonacoEnvironment?.getWorker?.(opts.moduleId ?? '', opts.label ?? 'editorWorkerService');
    if (!spawned) {
      return originalCreateWebWorker(opts);
    }
    const worker = Promise.resolve(spawned).then((w) => {
      // Handshake order: discard message first, then createData (see monaco-worker-manager#272).
      w.postMessage('ignore');
      w.postMessage(opts.createData ?? {});
      return w;
    });
    return originalCreateWebWorker({ ...opts, worker });
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
