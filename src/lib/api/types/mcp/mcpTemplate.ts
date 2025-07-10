type Condition = {
  lastTransitionTime: string;
  message: string;
  observedGeneration: number;
  reason: string;
  status: string;
  type: string;
};

type DefaultMember = {
  name: string;
  removable: boolean;
};

type DefaultComponent = {
  name: string;
  removable?: boolean;
  version: string;
  versionChangeable?: boolean;
};

type Components = {
  defaultComponents: DefaultComponent[];
};

type Authorization = {
  allowAddMembers?: boolean;
  defaultMembers: DefaultMember[];
};

type Authentication = {
  allowAdd?: boolean;
  system: {
    changeable: boolean;
    enabled: boolean;
  };
};

type Meta = {
  displayName: {
    prefix: string;
  };
  name: {
    prefix: string;
  };
};

// Extend: ChargingTarget type and add to metadata
export type ChargingTarget = {
  type: string;
  value: string;
};

type ManagedControlPlaneTemplateSpec = {
  meta: Meta;
  spec: {
    authentication: Authentication;
    authorization: Authorization;
    components: Components;
  };
};

type ManagedControlPlaneTemplateStatus = {
  conditions: Condition[];
  state: string;
};

export type ManagedControlPlaneTemplate = {
  apiVersion: string;
  kind: string;
  metadata: {
    annotations: {
      [key: string]: string;
    };
    creationTimestamp: string;
    finalizers: string[];
    generation: number;
    labels: {
      [key: string]: string;
    };
    name: string;
    namespace: string;
    resourceVersion: string;
    uid: string;
    chargingTarget?: ChargingTarget; // <-- Added here
  };
  spec: ManagedControlPlaneTemplateSpec;
  status: ManagedControlPlaneTemplateStatus;
};

type ListMetadata = {
  resourceVersion: string;
};

export type ManagedControlPlaneTemplateList = {
  apiVersion: string;
  kind: string;
  items: ManagedControlPlaneTemplate[];
  metadata: ListMetadata;
};

export const managedControlPlaneTemplate: ManagedControlPlaneTemplateList = {
  apiVersion: 'v1',
  kind: 'List',
  items: [
    {
      apiVersion: 'kro.run/v1alpha1',
      kind: 'ManagedControlPlaneTemplate',
      metadata: {
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration': `{"apiVersion":"kro.run/v1alpha1","kind":"ManagedControlPlaneTemplate","metadata":{"annotations":{"openmcp.cloud/displayName":"Webapp Test Template"},"name":"testtemplate","namespace":"project-webapp-playground"},"spec":{"meta":{"displayName":{"prefix":"Webapp "},"name":{"prefix":"webapp-"}},"spec":{"authentication":{"system":{"changeable":false,"enabled":true}},"authorization":{"defaultMembers":[{"name":"openmcp:moritz.reich@sap.com","removable":false},{"name":"openmcp:johannes.ott@sap.com","removable":true}]},"components":{"defaultComponents":[{"name":"crossplane","version":"1.19.0"}]}}}}`,
          'openmcp.cloud/displayName': 'Webapp Test Template',
        },
        creationTimestamp: '2025-07-09T14:56:45Z',
        finalizers: ['kro.run/finalizer'],
        generation: 2,
        labels: {
          'kro.run/kro-version': 'devel',
          'kro.run/owned': 'true',
          'kro.run/resource-graph-definition-id':
            '31987a49-8a07-4898-abaa-4f50c8d189f0',
          'kro.run/resource-graph-definition-name':
            'managedcontrolplanetemplate',
        },
        name: 'testtemplate',
        namespace: 'project-webapp-playground',
        resourceVersion: '39231946',
        uid: 'e761cc38-56d3-4fbe-add7-d31a0157c072',
        chargingTarget: { type: 'btp', value: '2319843191984831741' }, // Now valid
      },
      spec: {
        meta: {
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
            lastTransitionTime: '2025-07-09T16:57:46+02:00',
            message: 'Instance reconciled successfully',
            observedGeneration: 2,
            reason: 'ReconciliationSucceeded',
            status: 'True',
            type: 'InstanceSynced',
          },
        ],
        state: 'ACTIVE',
      },
    },
  ],
  metadata: {
    resourceVersion: '',
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
