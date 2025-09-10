import { ManagedControlPlaneTemplate } from "./mcpTemplate";

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
    name: 'Example Template',
    namespace: 'project-webapp-playground--ws-development',
    resourceVersion: '39236607',
    uid: 'e761cc38-56d3-4fbe-add7-d31a0157c072',
    descriptionText: 'This is a Template that empowers users of organization ABC',
  },
  spec: {
    meta: {
      chargingTarget: {
        type: 'btp',
        value: '449c6fb8-3504-4515-aa73-efd692cd2077',
      },
      displayName: {
        prefix: 'We-',
        sufix: '-test',
      },
      name: {
        prefix: 'we-',
        sufix: '-test',
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
            kind: 'User',
            role: 'admin',
            namespace: 'testnamespace',
          },
          {
            name: 'openmcp:johannes.ott@sap.com',
            removable: true,
            kind: 'ServiceAccount',
            role: 'viewer',
            namespace: 'testnamespace',
          },
        ],
      },
      components: {
        defaultComponents: [
          {
            name: 'crossplane',
            removable: true,
            version: '1.19.034',
            versionChangeable: true,
          },
          {
            name: 'external-secrets',
            removable: true,
            version: '0.18.224',
            versionChangeable: true,
          },
          {
            name: 'provider-btp',
            removable: true,
            version: '1.0.1',
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