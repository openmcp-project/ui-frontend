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
  description: 'A ServiceInstance allows to manage a ServiceInstance in BTP',
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
      description: 'A ServiceInstanceSpec defines the desired state of a ServiceInstance.',
      properties: {
        deletionPolicy: {
          default: 'Delete',
          description:
            'DeletionPolicy specifies what will happen to the underlying external\nwhen this managed resource is deleted - either "Delete" or "Orphan" the\nexternal resource.\nThis field is planned to be deprecated in favor of the ManagementPolicies\nfield in a future release. Currently, both could be set independently and\nnon-default values would be honored if the feature flag is enabled.\nSee the design doc for more information: https://github.com/crossplane/crossplane/blob/499895a25d1a1a0ba1604944ef98ac7a1a71f197/design/design-doc-observe-only-resources.md?plain=1#L223',
          enum: ['Orphan', 'Delete'],
          type: 'string',
        },
        forProvider: {
          description: 'ServiceInstanceParameters are the configurable fields of a ServiceInstance.',
          properties: {
            name: {
              description: 'Name of the service instance in btp, required',
              type: 'string',
            },
            offeringName: {
              description: 'Name of the service offering',
              type: 'string',
            },
            parameterSecretRefs: {
              description: 'Parameters stored in secret, will be merged with spec parameters',
              items: {
                description: 'A SecretKeySelector is a reference to a secret key in an arbitrary namespace.',
                properties: {
                  key: {
                    description: 'The key to select.',
                    type: 'string',
                  },
                  name: {
                    description: 'Name of the secret.',
                    type: 'string',
                  },
                  namespace: {
                    description: 'Namespace of the secret.',
                    type: 'string',
                  },
                },
                required: ['key', 'name', 'namespace'],
                type: 'object',
              },
              type: 'array',
            },
            parameters: {
              description:
                'Parameters in JSON or YAML format, will be merged with yaml parameters and secret parameters, will overwrite duplicated keys from secrets',
              type: 'object',
              'x-kubernetes-preserve-unknown-fields': true,
            },
            planName: {
              description: 'Name of the service plan of that offering',
              type: 'string',
            },
            serviceManagerRef: {
              description: 'A Reference to a named object.',
              properties: {
                name: {
                  description: 'Name of the referenced object.',
                  type: 'string',
                },
                policy: {
                  description: 'Policies for referencing.',
                  properties: {
                    resolution: {
                      default: 'Required',
                      description:
                        "Resolution specifies whether resolution of this reference is required.\nThe default is 'Required', which means the reconcile will fail if the\nreference cannot be resolved. 'Optional' means this reference will be\na no-op if it cannot be resolved.",
                      enum: ['Required', 'Optional'],
                      type: 'string',
                    },
                    resolve: {
                      description:
                        "Resolve specifies when this reference should be resolved. The default\nis 'IfNotPresent', which will attempt to resolve the reference only when\nthe corresponding field is not present. Use 'Always' to resolve the\nreference on every reconcile.",
                      enum: ['Always', 'IfNotPresent'],
                      type: 'string',
                    },
                  },
                  type: 'object',
                },
              },
              required: ['name'],
              type: 'object',
            },
            serviceManagerSecret: {
              type: 'string',
            },
            serviceManagerSecretNamespace: {
              type: 'string',
            },
            serviceManagerSelector: {
              description: 'A Selector selects an object.',
              properties: {
                matchControllerRef: {
                  description:
                    'MatchControllerRef ensures an object with the same controller reference\nas the selecting object is selected.',
                  type: 'boolean',
                },
                matchLabels: {
                  additionalProperties: {
                    type: 'string',
                  },
                  description: 'MatchLabels ensures an object with matching labels is selected.',
                  type: 'object',
                },
                policy: {
                  description: 'Policies for selection.',
                  properties: {
                    resolution: {
                      default: 'Required',
                      description:
                        "Resolution specifies whether resolution of this reference is required.\nThe default is 'Required', which means the reconcile will fail if the\nreference cannot be resolved. 'Optional' means this reference will be\na no-op if it cannot be resolved.",
                      enum: ['Required', 'Optional'],
                      type: 'string',
                    },
                    resolve: {
                      description:
                        "Resolve specifies when this reference should be resolved. The default\nis 'IfNotPresent', which will attempt to resolve the reference only when\nthe corresponding field is not present. Use 'Always' to resolve the\nreference on every reconcile.",
                      enum: ['Always', 'IfNotPresent'],
                      type: 'string',
                    },
                  },
                  type: 'object',
                },
              },
              type: 'object',
            },
            subaccountId: {
              description: '(String) The ID of the subaccount.\nThe ID of the subaccount.',
              type: 'string',
            },
            subaccountRef: {
              description: 'Reference to a Subaccount in account to populate subaccountId.',
              properties: {
                name: {
                  description: 'Name of the referenced object.',
                  type: 'string',
                },
                policy: {
                  description: 'Policies for referencing.',
                  properties: {
                    resolution: {
                      default: 'Required',
                      description:
                        "Resolution specifies whether resolution of this reference is required.\nThe default is 'Required', which means the reconcile will fail if the\nreference cannot be resolved. 'Optional' means this reference will be\na no-op if it cannot be resolved.",
                      enum: ['Required', 'Optional'],
                      type: 'string',
                    },
                    resolve: {
                      description:
                        "Resolve specifies when this reference should be resolved. The default\nis 'IfNotPresent', which will attempt to resolve the reference only when\nthe corresponding field is not present. Use 'Always' to resolve the\nreference on every reconcile.",
                      enum: ['Always', 'IfNotPresent'],
                      type: 'string',
                    },
                  },
                  type: 'object',
                },
              },
              required: ['name'],
              type: 'object',
            },
            subaccountSelector: {
              description: 'Selector for a Subaccount in account to populate subaccountId.',
              properties: {
                matchControllerRef: {
                  description:
                    'MatchControllerRef ensures an object with the same controller reference\nas the selecting object is selected.',
                  type: 'boolean',
                },
                matchLabels: {
                  additionalProperties: {
                    type: 'string',
                  },
                  description: 'MatchLabels ensures an object with matching labels is selected.',
                  type: 'object',
                },
                policy: {
                  description: 'Policies for selection.',
                  properties: {
                    resolution: {
                      default: 'Required',
                      description:
                        "Resolution specifies whether resolution of this reference is required.\nThe default is 'Required', which means the reconcile will fail if the\nreference cannot be resolved. 'Optional' means this reference will be\na no-op if it cannot be resolved.",
                      enum: ['Required', 'Optional'],
                      type: 'string',
                    },
                    resolve: {
                      description:
                        "Resolve specifies when this reference should be resolved. The default\nis 'IfNotPresent', which will attempt to resolve the reference only when\nthe corresponding field is not present. Use 'Always' to resolve the\nreference on every reconcile.",
                      enum: ['Always', 'IfNotPresent'],
                      type: 'string',
                    },
                  },
                  type: 'object',
                },
              },
              type: 'object',
            },
          },
          required: ['name'],
          type: 'object',
        },
        managementPolicies: {
          default: ['*'],
          description:
            'THIS IS A BETA FIELD. It is on by default but can be opted out\nthrough a Crossplane feature flag.\nManagementPolicies specify the array of actions Crossplane is allowed to\ntake on the managed and external resources.\nThis field is planned to replace the DeletionPolicy field in a future\nrelease. Currently, both could be set independently and non-default\nvalues would be honored if the feature flag is enabled. If both are\ncustom, the DeletionPolicy field will be ignored.\nSee the design doc for more information: https://github.com/crossplane/crossplane/blob/499895a25d1a1a0ba1604944ef98ac7a1a71f197/design/design-doc-observe-only-resources.md?plain=1#L223\nand this one: https://github.com/crossplane/crossplane/blob/444267e84783136daa93568b364a5f01228cacbe/design/one-pager-ignore-changes.md',
          items: {
            description:
              'A ManagementAction represents an action that the Crossplane controllers\ncan take on an external resource.',
            enum: ['Observe', 'Create', 'Update', 'Delete', 'LateInitialize', '*'],
            type: 'string',
          },
          type: 'array',
        },
        providerConfigRef: {
          default: {
            name: 'default',
          },
          description:
            'ProviderConfigReference specifies how the provider that will be used to\ncreate, observe, update, and delete this managed resource should be\nconfigured.',
          properties: {
            name: {
              description: 'Name of the referenced object.',
              type: 'string',
            },
            policy: {
              description: 'Policies for referencing.',
              properties: {
                resolution: {
                  default: 'Required',
                  description:
                    "Resolution specifies whether resolution of this reference is required.\nThe default is 'Required', which means the reconcile will fail if the\nreference cannot be resolved. 'Optional' means this reference will be\na no-op if it cannot be resolved.",
                  enum: ['Required', 'Optional'],
                  type: 'string',
                },
                resolve: {
                  description:
                    "Resolve specifies when this reference should be resolved. The default\nis 'IfNotPresent', which will attempt to resolve the reference only when\nthe corresponding field is not present. Use 'Always' to resolve the\nreference on every reconcile.",
                  enum: ['Always', 'IfNotPresent'],
                  type: 'string',
                },
              },
              type: 'object',
            },
          },
          required: ['name'],
          type: 'object',
        },
        publishConnectionDetailsTo: {
          description:
            'PublishConnectionDetailsTo specifies the connection secret config which\ncontains a name, metadata and a reference to secret store config to\nwhich any connection details for this managed resource should be written.\nConnection details frequently include the endpoint, username,\nand password required to connect to the managed resource.',
          properties: {
            configRef: {
              default: {
                name: 'default',
              },
              description:
                'SecretStoreConfigRef specifies which secret store config should be used\nfor this ConnectionSecret.',
              properties: {
                name: {
                  description: 'Name of the referenced object.',
                  type: 'string',
                },
                policy: {
                  description: 'Policies for referencing.',
                  properties: {
                    resolution: {
                      default: 'Required',
                      description:
                        "Resolution specifies whether resolution of this reference is required.\nThe default is 'Required', which means the reconcile will fail if the\nreference cannot be resolved. 'Optional' means this reference will be\na no-op if it cannot be resolved.",
                      enum: ['Required', 'Optional'],
                      type: 'string',
                    },
                    resolve: {
                      description:
                        "Resolve specifies when this reference should be resolved. The default\nis 'IfNotPresent', which will attempt to resolve the reference only when\nthe corresponding field is not present. Use 'Always' to resolve the\nreference on every reconcile.",
                      enum: ['Always', 'IfNotPresent'],
                      type: 'string',
                    },
                  },
                  type: 'object',
                },
              },
              required: ['name'],
              type: 'object',
            },
            metadata: {
              description: 'Metadata is the metadata for connection secret.',
              properties: {
                annotations: {
                  additionalProperties: {
                    type: 'string',
                  },
                  description:
                    'Annotations are the annotations to be added to connection secret.\n- For Kubernetes secrets, this will be used as "metadata.annotations".\n- It is up to Secret Store implementation for others store types.',
                  type: 'object',
                },
                labels: {
                  additionalProperties: {
                    type: 'string',
                  },
                  description:
                    'Labels are the labels/tags to be added to connection secret.\n- For Kubernetes secrets, this will be used as "metadata.labels".\n- It is up to Secret Store implementation for others store types.',
                  type: 'object',
                },
                type: {
                  description:
                    'Type is the SecretType for the connection secret.\n- Only valid for Kubernetes Secret Stores.',
                  type: 'string',
                },
              },
              type: 'object',
            },
            name: {
              description: 'Name is the name of the connection secret.',
              type: 'string',
            },
          },
          required: ['name'],
          type: 'object',
        },
        writeConnectionSecretToRef: {
          description:
            'WriteConnectionSecretToReference specifies the namespace and name of a\nSecret to which any connection details for this managed resource should\nbe written. Connection details frequently include the endpoint, username,\nand password required to connect to the managed resource.\nThis field is planned to be replaced in a future release in favor of\nPublishConnectionDetailsTo. Currently, both could be set independently\nand connection details would be published to both without affecting\neach other.',
          properties: {
            name: {
              description: 'Name of the secret.',
              type: 'string',
            },
            namespace: {
              description: 'Namespace of the secret.',
              type: 'string',
            },
          },
          required: ['name', 'namespace'],
          type: 'object',
        },
      },
      required: ['forProvider'],
      type: 'object',
    },
    status: {
      description: 'A ServiceInstanceStatus represents the observed state of a ServiceInstance.',
      properties: {
        atProvider: {
          description: 'ServiceInstanceObservation are the observable fields of a ServiceInstance.',
          properties: {
            id: {
              type: 'string',
            },
            serviceplanId: {
              description: 'The ID of the service plan as resolved by the ServiceManager',
              type: 'string',
            },
          },
          type: 'object',
        },
        conditions: {
          description: 'Conditions of the resource.',
          items: {
            description: 'A Condition that may apply to a resource.',
            properties: {
              lastTransitionTime: {
                description:
                  'LastTransitionTime is the last time this condition transitioned from one\nstatus to another.',
                format: 'date-time',
                type: 'string',
              },
              message: {
                description:
                  "A Message containing details about this condition's last transition from\none status to another, if any.",
                type: 'string',
              },
              observedGeneration: {
                description:
                  'ObservedGeneration represents the .metadata.generation that the condition was set based upon.\nFor instance, if .metadata.generation is currently 12, but the .status.conditions[x].observedGeneration is 9, the condition is out of date\nwith respect to the current state of the instance.',
                format: 'int64',
                type: 'integer',
              },
              reason: {
                description: "A Reason for this condition's last transition from one status to another.",
                type: 'string',
              },
              status: {
                description: 'Status of this condition; is it currently True, False, or Unknown?',
                type: 'string',
              },
              type: {
                description:
                  'Type of this condition. At most one of each condition type may apply to\na resource at any point in time.',
                type: 'string',
              },
            },
            required: ['lastTransitionTime', 'reason', 'status', 'type'],
            type: 'object',
          },
          type: 'array',
          'x-kubernetes-list-map-keys': ['type'],
          'x-kubernetes-list-type': 'map',
        },
        observedGeneration: {
          description:
            'ObservedGeneration is the latest metadata.generation\nwhich resulted in either a ready state, or stalled due to error\nit can not recover from without human intervention.',
          format: 'int64',
          type: 'integer',
        },
      },
      type: 'object',
    },
  },
  required: ['spec'],
  type: 'object',
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
