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
  description: 'ManagedControlPlane is the Schema for the ManagedControlPlane API',
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
      description: 'ManagedControlPlaneSpec defines the desired state of ManagedControlPlane.',
      type: 'object',
      required: ['components'],
      properties: {
        authentication: {
          description: 'Authentication contains the configuration for the enabled OpenID Connect identity providers',
          type: 'object',
          properties: {
            enableSystemIdentityProvider: {
              type: 'boolean',
            },
            identityProviders: {
              type: 'array',
              items: {
                description: 'IdentityProvider contains the configuration for an OpenID Connect identity provider',
                type: 'object',
                required: ['clientID', 'issuerURL', 'name', 'usernameClaim'],
                properties: {
                  caBundle: {
                    description:
                      "CABundle: When set, the OpenID server's certificate will be verified by one of the authorities in the bundle.\nOtherwise, the host's root CA set will be used.",
                    type: 'string',
                  },
                  clientConfig: {
                    description: 'ClientAuthentication contains configuration for OIDC clients',
                    type: 'object',
                    properties: {
                      clientSecret: {
                        description:
                          'ClientSecret is a references to a secret containing the client secret.\nThe client secret will be added to the generated kubeconfig with the "--oidc-client-secret" flag.',
                        type: 'object',
                        required: ['key', 'name'],
                        properties: {
                          key: {
                            description: 'Key is the key inside the secret.',
                            type: 'string',
                          },
                          name: {
                            description: 'Name is the secret name.',
                            type: 'string',
                          },
                        },
                      },
                      extraConfig: {
                        description:
                          'ExtraConfig is added to the client configuration in the kubeconfig.\nCan either be a single string value, a list of string values or no value.\nMust not contain any of the following keys:\n- "client-id"\n- "client-secret"\n- "issuer-url"',
                        type: 'object',
                        additionalProperties: {
                          description:
                            'SingleOrMultiStringValue is a type that can hold either a single string value or a list of string values.',
                          type: 'object',
                          properties: {
                            value: {
                              description: 'Value is a single string value.',
                              type: 'string',
                            },
                            values: {
                              description: 'Values is a list of string values.',
                              type: 'array',
                              items: {
                                type: 'string',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  clientID: {
                    description: 'ClientID is the client ID of the identity provider.',
                    type: 'string',
                  },
                  groupsClaim: {
                    description: 'GroupsClaim is the claim that contains the groups.',
                    type: 'string',
                  },
                  issuerURL: {
                    description: 'IssuerURL is the issuer URL of the identity provider.',
                    type: 'string',
                  },
                  name: {
                    description:
                      'Name is the name of the identity provider.\nThe name must be unique among all identity providers.\nThe name must only contain lowercase letters.\nThe length must not exceed 63 characters.',
                    type: 'string',
                    maxLength: 63,
                    pattern: '^[a-z]+$',
                  },
                  requiredClaims: {
                    description:
                      'RequiredClaims is a map of required claims. If set, the identity provider must provide these claims in the ID token.',
                    type: 'object',
                    additionalProperties: {
                      type: 'string',
                    },
                  },
                  signingAlgs: {
                    description: 'SigningAlgs is the list of allowed JOSE asymmetric signing algorithms.',
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  usernameClaim: {
                    description: 'UsernameClaim is the claim that contains the username.',
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        authorization: {
          description: 'Authorization contains the configuration of the subjects assigned to control plane roles',
          type: 'object',
          required: ['roleBindings'],
          properties: {
            roleBindings: {
              description: 'RoleBindings is a list of role bindings',
              type: 'array',
              items: {
                description: 'RoleBinding contains the role and the subjects assigned to the role',
                type: 'object',
                required: ['role', 'subjects'],
                properties: {
                  role: {
                    description: 'Role is the name of the role',
                    type: 'string',
                    enum: ['admin', 'view'],
                  },
                  subjects: {
                    description: 'Subjects is a list of subjects assigned to the role',
                    type: 'array',
                    items: {
                      description:
                        'Subject describes an object that is assigned to a role and\nwhich can be used to authenticate against the control plane.',
                      type: 'object',
                      required: ['kind', 'name'],
                      properties: {
                        apiGroup: {
                          description: 'APIGroup is the API group of the subject',
                          type: 'string',
                        },
                        kind: {
                          description: 'Kind is the kind of the subject',
                          type: 'string',
                          enum: ['ServiceAccount', 'User', 'Group'],
                        },
                        name: {
                          description: 'Name is the name of the subject',
                          type: 'string',
                          minLength: 1,
                        },
                        namespace: {
                          description: 'Namespace is the namespace of the subject',
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          description:
            'Components contains the configuration for Components like APIServer, Landscaper, CloudOrchestrator.',
          type: 'object',
          properties: {
            apiServer: {
              description:
                'APIServerConfiguration contains the configuration which is required for setting up a k8s cluster to be used as APIServer.',
              type: 'object',
              default: {
                type: 'GardenerDedicated',
              },
              required: ['type'],
              properties: {
                gardener: {
                  description:
                    "GardenerConfig contains configuration for a Gardener APIServer.\nMust be set if type is 'Gardener', is ignored otherwise.",
                  type: 'object',
                  properties: {
                    auditLog: {
                      description:
                        'AuditLogConfig defines the AuditLog configuration for the ManagedControlPlane cluster.',
                      type: 'object',
                      required: ['policyRef', 'secretRef', 'serviceURL', 'tenantID', 'type'],
                      properties: {
                        policyRef: {
                          description:
                            'PolicyRef is the reference to the policy containing the configuration for the audit log service.',
                          type: 'object',
                          properties: {
                            name: {
                              description:
                                'Name of the referent.\nThis field is effectively required, but due to backwards compatibility is\nallowed to be empty. Instances of this type with an empty value here are\nalmost certainly wrong.\nMore info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names',
                              type: 'string',
                              default: '',
                            },
                          },
                          'x-kubernetes-map-type': 'atomic',
                        },
                        secretRef: {
                          description:
                            'SecretRef is the reference to the secret containing the credentials for the audit log service.',
                          type: 'object',
                          properties: {
                            name: {
                              description:
                                'Name of the referent.\nThis field is effectively required, but due to backwards compatibility is\nallowed to be empty. Instances of this type with an empty value here are\nalmost certainly wrong.\nMore info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names',
                              type: 'string',
                              default: '',
                            },
                          },
                          'x-kubernetes-map-type': 'atomic',
                        },
                        serviceURL: {
                          description: 'ServiceURL is the URL from the Service Keys.',
                          type: 'string',
                        },
                        tenantID: {
                          description:
                            'TenantID is the tenant ID of the BTP Subaccount. Can be seen in the BTP Cockpit dashboard.',
                          type: 'string',
                        },
                        type: {
                          description: 'Type is the type of the audit log.',
                          type: 'string',
                          enum: ['standard'],
                        },
                      },
                    },
                    encryptionConfig: {
                      description: 'EncryptionConfig contains customizable encryption configuration of the API server.',
                      type: 'object',
                      properties: {
                        resources: {
                          description:
                            'Resources contains the list of resources that shall be encrypted in addition to secrets.\nEach item is a Kubernetes resource name in plural (resource or resource.group) that should be encrypted.\nExample: ["configmaps", "statefulsets.apps", "flunders.emxample.com"]',
                          type: 'array',
                          items: {
                            type: 'string',
                          },
                        },
                      },
                    },
                    highAvailability: {
                      description: 'HighAvailabilityConfig specifies the HA configuration for the API server.',
                      type: 'object',
                      required: ['failureToleranceType'],
                      properties: {
                        failureToleranceType: {
                          description:
                            'FailureToleranceType specifies failure tolerance mode for the API server.\nAllowed values are: node, zone\nnode: The API server is tolerant to node failures within a single zone.\nzone: The API server is tolerant to zone failures.',
                          type: 'string',
                          enum: ['node', 'zone'],
                          'x-kubernetes-validations': [
                            {
                              rule: 'self == oldSelf',
                              message: 'failureToleranceType is immutable',
                            },
                          ],
                        },
                      },
                      'x-kubernetes-validations': [
                        {
                          rule: 'self == oldSelf',
                          message: 'highAvailability is immutable',
                        },
                      ],
                    },
                    region: {
                      description:
                        "Region is the region to be used for the Shoot cluster.\nThis is usually derived from the ManagedControlPlane's common configuration, but can be overwritten here.",
                      type: 'string',
                      'x-kubernetes-validations': [
                        {
                          rule: 'self == oldSelf',
                          message: 'region is immutable',
                        },
                      ],
                    },
                  },
                  'x-kubernetes-validations': [
                    {
                      rule: 'has(self.highAvailability) == has(oldSelf.highAvailability) || has(self.highAvailability)',
                      message: 'highAvailability is required once set',
                    },
                  ],
                },
                type: {
                  description:
                    'Type is the type of APIServer. This determines which other configuration fields need to be specified.\nValid values are:\n- Gardener\n- GardenerDedicated',
                  type: 'string',
                  default: 'GardenerDedicated',
                  enum: ['Gardener', 'GardenerDedicated'],
                  'x-kubernetes-validations': [
                    {
                      rule: 'self == oldSelf',
                      message: 'type is immutable',
                    },
                  ],
                },
              },
            },
            btpServiceOperator: {
              description:
                'BTPServiceOperator defines the configuration for setting up the BTPServiceOperator component in a ManagedControlPlane.',
              type: 'object',
              required: ['version'],
              properties: {
                version: {
                  description: 'The Version of BTP Service Operator to install.',
                  type: 'string',
                },
              },
            },
            crossplane: {
              description:
                'Crossplane defines the configuration for setting up the Crossplane component in a ManagedControlPlane.',
              type: 'object',
              required: ['version'],
              properties: {
                providers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['name', 'version'],
                    properties: {
                      name: {
                        description:
                          'Name of the provider.\nUsing a well-known name will automatically configure the "package" field.',
                        type: 'string',
                      },
                      version: {
                        description: 'Version of the provider to install.',
                        type: 'string',
                      },
                    },
                  },
                },
                version: {
                  description: 'The Version of Crossplane to install.',
                  type: 'string',
                },
              },
            },
            externalSecretsOperator: {
              description:
                'ExternalSecretsOperator defines the configuration for setting up the ExternalSecretsOperator component in a ManagedControlPlane.',
              type: 'object',
              required: ['version'],
              properties: {
                version: {
                  description: 'The Version of External Secrets Operator to install.',
                  type: 'string',
                },
              },
            },
            flux: {
              description: 'Flux defines the configuration for setting up the Flux component in a ManagedControlPlane.',
              type: 'object',
              required: ['version'],
              properties: {
                version: {
                  description: 'The Version of Flux to install.',
                  type: 'string',
                },
              },
            },
            kyverno: {
              description:
                'Kyverno defines the configuration for setting up the Kyverno component in a ManagedControlPlane.',
              type: 'object',
              required: ['version'],
              properties: {
                version: {
                  description: 'The Version of Kyverno to install.',
                  type: 'string',
                },
              },
            },
            landscaper: {
              description:
                'LandscaperConfiguration contains the configuration which is required for setting up a LaaS instance.',
              type: 'object',
              properties: {
                deployers: {
                  description: 'Deployers is the list of deployers that should be installed.',
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
          'x-kubernetes-validations': [
            {
              rule: '!has(oldSelf.apiServer)|| has(self.apiServer)',
              message: 'apiServer is required once set',
            },
          ],
        },
        desiredRegion: {
          description: 'DesiredRegion allows customers to specify a desired region proximity.',
          type: 'object',
          properties: {
            direction: {
              description: 'Direction is the direction within the region.',
              type: 'string',
              enum: ['north', 'east', 'south', 'west', 'central'],
            },
            name: {
              description: 'Name is the name of the region.',
              type: 'string',
              enum: ['northamerica', 'southamerica', 'europe', 'asia', 'africa', 'australia'],
            },
          },
          'x-kubernetes-validations': [
            {
              rule: 'self == oldSelf',
              message: 'RegionSpecification is immutable',
            },
          ],
        },
        disabledComponents: {
          description:
            'DisabledComponents contains a list of component types.\nThe resources for these components will still be generated, but they will get the ignore operation annotation, so they should not be processed by their respective controllers.',
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      'x-kubernetes-validations': [
        {
          rule: '!has(oldSelf.desiredRegion)|| has(self.desiredRegion)',
          message: 'desiredRegion is required once set',
        },
      ],
    },
    status: {
      description: 'ManagedControlPlaneStatus defines the observed state of ManagedControlPlane.',
      type: 'object',
      required: ['observedGeneration', 'status'],
      properties: {
        components: {
          description:
            'ManagedControlPlaneComponentsStatus contains the status of the components of a ManagedControlPlane.',
          type: 'object',
          properties: {
            apiServer: {
              description:
                'ExternalAPIServerStatus contains the status of the API server / ManagedControlPlane cluster. The Kuberenetes can act as an OIDC\ncompatible provider in a sense that they serve OIDC issuer endpoint URL so that other system can validate tokens that have been\nissued by the external party.',
              type: 'object',
              properties: {
                endpoint: {
                  description: 'Endpoint represents the Kubernetes API server endpoint',
                  type: 'string',
                },
                serviceAccountIssuer: {
                  description:
                    'ServiceAccountIssuer represents the OpenIDConnect issuer URL that can be used to verify service account tokens.',
                  type: 'string',
                },
              },
            },
            authentication: {
              description: 'ExternalAuthenticationStatus contains the status of the  authentication component.',
              type: 'object',
              properties: {
                access: {
                  description:
                    'UserAccess reference the secret containing the kubeconfig\nfor the APIServer which is to be used by the customer.',
                  type: 'object',
                  required: ['key', 'name', 'namespace'],
                  properties: {
                    key: {
                      description: 'Key is the key inside the secret.',
                      type: 'string',
                    },
                    name: {
                      description: "Name is the object's name.",
                      type: 'string',
                    },
                    namespace: {
                      description: "Namespace is the object's namespace.",
                      type: 'string',
                    },
                  },
                },
              },
            },
            authorization: {
              description: 'ExternalAuthorizationStatus contains the status of the external authorization component',
              type: 'object',
            },
            cloudOrchestrator: {
              description: 'ExternalCloudOrchestratorStatus contains the status of the CloudOrchestrator component.',
              type: 'object',
            },
            landscaper: {
              description: 'ExternalLandscaperStatus contains the status of a LaaS instance.',
              type: 'object',
            },
          },
        },
        conditions: {
          description: 'Conditions collects the conditions of all components.',
          type: 'array',
          items: {
            type: 'object',
            required: ['managedBy', 'status', 'type'],
            properties: {
              lastTransitionTime: {
                description: "LastTransitionTime specifies the time when this condition's status last changed.",
                type: 'string',
                format: 'date-time',
              },
              managedBy: {
                description: 'ManagedBy contains the information which component manages this condition.',
                type: 'string',
              },
              message: {
                description:
                  'Message contains further details regarding the condition.\nIt is meant for human users, Reason should be used for programmatic evaluation instead.\nIt is optional, but should be filled at least when Status is not "True".',
                type: 'string',
              },
              reason: {
                description:
                  'Reason is expected to contain a CamelCased string that provides further information regarding the condition.\nIt should have a fixed value set (like an enum) to be machine-readable. The value set depends on the condition type.\nIt is optional, but should be filled at least when Status is not "True".',
                type: 'string',
              },
              status: {
                description: 'Status is the status of the condition.',
                type: 'string',
              },
              type: {
                description:
                  'Type is the type of the condition.\nThis is a unique identifier and each type of condition is expected to be managed by exactly one component controller.',
                type: 'string',
              },
            },
          },
        },
        message: {
          description: 'Message contains an optional message.',
          type: 'string',
        },
        observedGeneration: {
          description:
            'ObservedGeneration is the last generation of this resource that has successfully been reconciled.',
          type: 'integer',
          format: 'int64',
        },
        status: {
          description:
            'Status is the current status of the ManagedControlPlane.\nIt is "Deleting" if the ManagedControlPlane is being deleted.\nIt is "Ready" if all conditions are true, and "Not Ready" otherwise.',
          type: 'string',
        },
      },
    },
  },
  'x-kubernetes-validations': [
    {
      rule: 'size(self.metadata.name) <= 36',
      message: 'name must not be longer than 36 characters',
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
