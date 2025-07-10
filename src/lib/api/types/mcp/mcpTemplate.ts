export type ManagedControlPlaneTemplateList = {
  apiVersion: string;
  items: ManagedControlPlaneTemplate[];
};

export type ManagedControlPlaneTemplate = {
  apiVersion: string;
  kind: string;
  metadata: {
    annotations?: Record<string, string>;
    creationTimestamp?: string;
    finalizers?: string[];
    generation?: number;
    labels?: Record<string, string>;
    name: string;
    namespace: string;
    resourceVersion?: string;
    uid?: string;
  };
  spec: {
    meta: {
      chargingTarget: {
        type: string;
        value: string;
      };
      displayName: {
        prefix: string;
      };
      name: {
        prefix: string;
      };
    };
    spec: {
      authentication: {
        allowAdd?: boolean;
        system: {
          changeable: boolean;
          enabled: boolean;
        };
      };
      authorization: {
        allowAddMembers?: boolean;
        defaultMembers: {
          name: string;
          removable: boolean;
        }[];
      };
      components: {
        defaultComponents: {
          name: string;
          removable?: boolean;
          version: string;
          versionChangeable?: boolean;
        }[];
      };
    };
  };
  status?: {
    conditions?: {
      lastTransitionTime: string;
      message: string;
      observedGeneration: number;
      reason: string;
      status: string;
      type: string;
    }[];
    state?: string;
  };
};

export const managedControlPlaneTemplate: ManagedControlPlaneTemplate = {
  apiVersion: 'kro.run/v1alpha1',
  kind: 'ManagedControlPlaneTemplate',
  metadata: {
    annotations: {
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"kro.run/v1alpha1","kind":"ManagedControlPlaneTemplate","metadata":{"annotations":{"openmcp.cloud/displayName":"Webapp Test Template"},"name":"testtemplate","namespace":"project-webapp-playground"},"spec":{"meta":{"chargingTarget":{"type":"btp","value":"2319843191984831741"},"displayName":{"prefix":"Webapp "},"name":{"prefix":"webapp-"}},"spec":{"authentication":{"system":{"changeable":false,"enabled":true}},"authorization":{"defaultMembers":[{"name":"openmcp:moritz.reich@sap.com","removable":false},{"name":"openmcp:johannes.ott@sap.com","removable":true}]},"components":{"defaultComponents":[{"name":"crossplane","version":"1.19.0"}]}}}}\n',
      'openmcp.cloud/displayName': 'Webapp Test Template',
    },
    creationTimestamp: '2025-07-09T14:56:45Z',
    finalizers: ['kro.run/finalizer'],
    generation: 3,
    labels: {
      'kro.run/kro-version': 'devel',
      'kro.run/owned': 'true',
      'kro.run/resource-graph-definition-id': '31987a49-8a07-4898-abaa-4f50c8d189f0',
      'kro.run/resource-graph-definition-name': 'managedcontrolplanetemplate',
    },
    name: 'testtemplate',
    namespace: 'project-webapp-playground',
    resourceVersion: '39236607',
    uid: 'e761cc38-56d3-4fbe-add7-d31a0157c072',
  },
  spec: {
    meta: {
      chargingTarget: {
        type: 'btp',
        value: '2319843191984831741',
      },
      displayName: {
        prefix: 'Webapp ',
      },
      name: {
        prefix: 'webapp-',
      },
    },
    spec: {
      authentication: {
        allowAdd: true,
        system: {
          changeable: false,
          enabled: true,
        },
      },
      authorization: {
        allowAddMembers: true,
        defaultMembers: [
          {
            name: 'openmcp:moritz.reich@sap.com',
            removable: false,
          },
          {
            name: 'openmcp:johannes.ott@sap.com',
            removable: true,
          },
        ],
      },
      components: {
        defaultComponents: [
          {
            name: 'crossplane',
            removable: true,
            version: '1.19.0',
            versionChangeable: true,
          },
        ],
      },
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2025-07-09T17:25:33+02:00',
        message: 'Instance reconciled successfully',
        observedGeneration: 3,
        reason: 'ReconciliationSucceeded',
        status: 'True',
        type: 'InstanceSynced',
      },
    ],
    state: 'ACTIVE',
  },
};

type MCPTemplateMeta = {
  title: string;
  iconUrl: string;
  docsUrl: string;
};

export const MCPTemplayesList: MCPTemplateMeta[] = [
  { title: 'MCP Template 1', iconUrl: 'add-document', docsUrl: 'docsurl' },
  { title: 'MCP Template 2', iconUrl: 'address-book', docsUrl: 'docsurl2' },
];
