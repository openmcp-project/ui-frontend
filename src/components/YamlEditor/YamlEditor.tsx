import { Editor } from '@monaco-editor/react';
import type { ComponentProps } from 'react';
import { Button, Panel, Toolbar } from '@ui5/webcomponents-react';
import { parseDocument } from 'yaml';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT } from '../../lib/monaco.ts';
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';
import type { JSONSchema } from 'monaco-yaml';
import styles from './YamlEditor.module.css';
import openapiSchemaToJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';

export type YamlEditorProps = Omit<ComponentProps<typeof Editor>, 'language'> & {
  isEdit?: boolean;
  onApply?: (parsed: unknown, yaml: string) => void;
};

export const serviceInstanceSchema = openapiSchemaToJsonSchema({
  description: 'Workspace is the Schema for the workspaces API',
  type: 'object',
  properties: {
    apiVersion: {
      description:
        'APIVersion defines the versioned schema of this representation of an object.\nServers should convert recognized schemas to the latest internal value, and\nmay reject unrecognized values.\nMore info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources',
      type: 'string',
    },
    kind: {
      description:
        'Kind is a string value representing the REST resource this object represents.\nServers may infer this from the endpoint the client submits requests to.\nCannot be updated.\nIn CamelCase.\nMore info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds',
      type: 'string',
    },
    metadata: {
      type: 'object',
    },
    spec: {
      description: 'WorkspaceSpec defines the desired state of Workspace',
      type: 'object',
      properties: {
        members: {
          description: 'Members is a list of workspace members.',
          type: 'array',
          items: {
            type: 'object',
            required: ['kind', 'name', 'roles'],
            properties: {
              kind: {
                description: 'Kind of object being referenced. Can be "User", "Group", or "ServiceAccount".',
                type: 'string',
                enum: ['User', 'Group', 'ServiceAccount'],
              },
              name: {
                description: 'Name of the object being referenced.',
                type: 'string',
              },
              namespace: {
                description:
                  'Namespace of the referenced object. Required if Kind is "ServiceAccount". Must not be specified if Kind is "User" or "Group".',
                type: 'string',
              },
              roles: {
                description: 'Roles defines a list of roles that this workspace member should have.',
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['admin', 'view'],
                },
              },
            },
            'x-kubernetes-validations': [
              {
                rule: "self.kind == 'ServiceAccount' || !has(self.__namespace__)",
                message: 'Namespace must not be specified if Kind is User or Group',
              },
              {
                rule: "self.kind != 'ServiceAccount' || has(self.__namespace__)",
                message: 'Namespace is required for ServiceAccount',
              },
            ],
          },
        },
      },
    },
    status: {
      description: 'WorkspaceStatus defines the observed state of Workspace',
      type: 'object',
      required: ['namespace'],
      properties: {
        conditions: {
          type: 'array',
          items: {
            description: 'Condition is part of all conditions that a project/ workspace can have.',
            type: 'object',
            required: ['status', 'type'],
            properties: {
              details: {
                description:
                  'Details is an object that can contain additional information about the condition.\nThe content is specific to the condition type.',
                'x-kubernetes-preserve-unknown-fields': true,
              },
              lastTransitionTime: {
                description:
                  'LastTransitionTime is the time when the condition last transitioned from one status to another.',
                type: 'string',
                format: 'date-time',
              },
              message: {
                description: 'Message is a human-readable message indicating details about the condition.',
                type: 'string',
              },
              reason: {
                description: 'Reason is the reason for the condition.',
                type: 'string',
              },
              status: {
                description: 'Status is the status of the condition.',
                type: 'string',
                enum: ['True', 'False', 'Unknown'],
              },
              type: {
                description: 'Type is the type of the condition.',
                type: 'string',
              },
            },
          },
        },
        namespace: {
          type: 'string',
        },
      },
    },
  },
  'x-kubernetes-validations': [
    {
      rule: 'size(self.metadata.name) <= 25',
      message: 'Name must not be longer than 25 characters',
    },
  ],
});

// Track if monaco-yaml has been configured globally
let monacoYamlConfigured = false;

export const YamlEditor = (props: YamlEditorProps) => {
  const { isDarkTheme } = useTheme();
  const { t } = useTranslation();
  const { theme, options, value, defaultValue, onChange, isEdit = false, onApply, ...rest } = props;
  const computedTheme = theme ?? (isDarkTheme ? GITHUB_DARK_DEFAULT : GITHUB_LIGHT_DEFAULT);

  const [editorContent, setEditorContent] = useState<string>(value?.toString() ?? defaultValue?.toString() ?? '');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [applyAttempted, setApplyAttempted] = useState(false);

  useEffect(() => {
    if (typeof value !== 'undefined') {
      setEditorContent(value.toString());
    }
  }, [value]);

  useEffect(() => {
    // Configure YAML validation with schema only once
    if (!monacoYamlConfigured) {
      monacoYamlConfigured = true;
      configureMonacoYaml(monaco, {
        enableSchemaRequest: true,
        hover: true,
        completion: true,
        validate: true,
        format: true,
        schemas: [
          {
            schema: serviceInstanceSchema as JSONSchema,
            fileMatch: ['*'],
            uri: 'http://kubernetesjsonschema.dev/master-standalone/all.json',
          },
        ],
      });
    }
  }, []);

  const enforcedOptions: monaco.editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      ...(options as monaco.editor.IStandaloneEditorConstructionOptions),
      readOnly: isEdit ? false : (options?.readOnly ?? true),
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      wordWrap: 'on',
      folding: true,
      foldingStrategy: 'indentation',
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      suggestOnTriggerCharacters: true,
      glyphMargin: true,
      formatOnPaste: true,
      formatOnType: true,
      fontSize: 13,
      lineHeight: 20,
      renderWhitespace: 'boundary',
    }),
    [options, isEdit],
  );

  const handleEditorChange = useCallback(
    (val: string | undefined, event?: monaco.editor.IModelContentChangedEvent) => {
      if (isEdit) {
        setEditorContent(val ?? '');
      }
      if (event) {
        onChange?.(val ?? '', event);
      }
    },
    [isEdit, onChange],
  );

  const handleApply = useCallback(() => {
    const run = async () => {
      setApplyAttempted(true);
      try {
        const doc = parseDocument(editorContent);
        if (doc.errors && doc.errors.length) {
          setValidationErrors(doc.errors.map((e) => e.message));
          return;
        }
        setValidationErrors([]);
        const jsObj = doc.toJS();
        if (onApply) {
          await onApply(jsObj, editorContent);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setValidationErrors([e.message]);
        } else {
          setValidationErrors(['Unknown YAML parse error']);
        }
      }
    };
    run();
  }, [editorContent, onApply]);

  const showValidationErrors = isEdit && applyAttempted && validationErrors.length > 0;

  return (
    <div className={styles.container}>
      {isEdit && (
        <Toolbar design="Solid">
          <Button className={styles.applyButton} design="Emphasized" onClick={handleApply}>
            {t('buttons.applyChanges')}
          </Button>
        </Toolbar>
      )}
      <div className={styles.editorWrapper}>
        <Editor
          {...rest}
          value={isEdit ? editorContent : value}
          theme={computedTheme}
          options={enforcedOptions}
          height="100%"
          language="yaml"
          onChange={handleEditorChange}
        />
      </div>
      {showValidationErrors && (
        <Panel headerText={t('yaml.validationErrors')} className={styles.validationPanel}>
          <ul className={styles.validationList}>
            {validationErrors.map((err, idx) => (
              <li key={idx} className={styles.validationListItem}>
                {err}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
};
