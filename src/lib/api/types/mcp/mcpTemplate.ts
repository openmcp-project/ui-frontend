// TypeScript types

type NameMeta = {
  prefix?: string;
  suffix?: string;
  validationRegex?: string;
  validationMessage?: string;
};

type DisplayNameMeta = {
  prefix?: string;
  suffix?: string;
  validationRegex?: string;
  validationMessage?: string;
};

type ChargingTargetMeta = {
  type?: string;
  value?: string;
};

type MetaSpec = {
  name?: NameMeta;
  displayName?: DisplayNameMeta;
  chargingTarget?: ChargingTargetMeta;
};

type AuthenticationSystem = {
  enabled?: boolean;
  changeable?: boolean;
};

type CustomIDP = {
  removable?: boolean;
  // ...other possible fields
};

type AuthenticationSpec = {
  allowAdd?: boolean;
  system?: AuthenticationSystem;
  customIDPs?: Record<string, CustomIDP>;
};

type AuthorizationDefault = {
  name: string;
  removable?: boolean;
};

type AuthorizationSpec = {
  default?: AuthorizationDefault[];
  allowAdd?: boolean;
  allow?: string[];
  deny?: string[];
};

type ComponentDefault = {
  name: string;
  version: string;
  removable?: boolean;
  versionChangeable?: boolean;
};

type ComponentAllowDeny = {
  name: string;
  version: string[];
};

type ComponentsSpec = {
  default?: ComponentDefault[];
  allow?: ComponentAllowDeny[];
  deny?: ComponentAllowDeny[];
};

type SpecSpec = {
  authentication?: AuthenticationSpec;
  authorization?: AuthorizationSpec;
  components?: ComponentsSpec;
};

type ManagedControlPlaneTemplate = {
  kind: 'ManagedControlPlaneTemplate';
  meta: {
    name: string;
    namespace: string;
  };
  spec: {
    meta?: MetaSpec;
    spec?: SpecSpec;
  };
};

export const managedControlPlaneTemplate: ManagedControlPlaneTemplate = {
  kind: 'ManagedControlPlaneTemplate',
  meta: {
    name: 'managed-control-plane-template-sap-dev',
    namespace: 'project-sap-dev',
    // namespace: 'project-sap-dev--ws-ml-platform'
  },
  spec: {
    meta: {
      name: {
        prefix: 'mcp-',
        suffix: '-dev',
        validationRegex: '^[a-z0-9-]{3,30}$',
        validationMessage:
          'Name must be 3-30 characters, lowercase letters, numbers, and dashes only.',
      },
      displayName: {
        prefix: '[MCP]',
        suffix: ' (Dev)',
        validationRegex: '^.{3,50}$',
        validationMessage: 'Display name must be between 3 and 50 characters.',
      },
      chargingTarget: {
        type: 'cost-center',
        value: 'CC-123456',
      },
    },
    spec: {
      authentication: {
        allowAdd: false,
        system: {
          enabled: true,
          changeable: false,
        },
        customIDPs: {
          'sap-idp': {
            removable: false,
          },
          github: {
            removable: true,
          },
        },
      },
      authorization: {
        default: [
          {
            name: 'openmcp:alice.admin@sap.com',
            removable: false,
          },
          {
            name: 'openmcp:bob.viewer@sap.com',
            removable: true,
          },
        ],
        allowAdd: true,
        allow: [
          'openmcp:alice.admin@sap.com',
          'openmcp:bob.viewer@sap.com',
          'openmcp:carol.dev@sap.com',
        ],
        deny: ['openmcp:eve.blocked@sap.com'],
      },
      components: {
        default: [
          {
            name: 'crossplane',
            version: 'v1.12.0',
            removable: false,
            versionChangeable: false,
          },
          {
            name: 'provider-aws',
            version: 'v0.27.0',
            removable: true,
            versionChangeable: true,
          },
          {
            name: 'external-secrets',
            version: 'v0.8.0',
            removable: true,
            versionChangeable: true,
          },
        ],
        allow: [
          {
            name: 'crossplane',
            version: ['v1.10.0', 'v1.11.0', 'v1.12.0'],
          },
          {
            name: 'provider-aws',
            version: ['v0.25.0', 'v0.26.0', 'v0.27.0'],
          },
        ],
        deny: [
          {
            name: 'provider-azure',
            version: ['<v0.20.0'],
          },
        ],
      },
    },
  },
};

type MCPTemplateMeta = {
  title: string;
  iconUrl: string;
  docsUrl: string;
};

export const MCPTemplayesList: MCPTemplateMeta[] = [
  { title: 'MCPTitle', iconUrl: 'add-document', docsUrl: 'docsurl' },
  { title: 'MCPTitle2', iconUrl: 'address-book', docsUrl: 'docsurl2' },
];
