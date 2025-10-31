import { CreateManagedControlPlaneWizardContainer } from './CreateManagedControlPlaneWizardContainer.tsx';
import { useCreateManagedControlPlane } from '../../../hooks/useCreateManagedControlPlane.ts';
import { CreateManagedControlPlaneType } from '../../../lib/api/types/crate/createManagedControlPlane.ts';
import { useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { useComponentsQuery } from '../../../hooks/useComponentsQuery.ts';
import '@ui5/webcomponents-cypress-commands';
import { ManagedControlPlaneInterface } from '../../../lib/api/types/mcpResource.ts';
import { useUpdateManagedControlPlane } from '../../../hooks/useUpdateManagedControlPlane.ts';

describe('CreateManagedControlPlaneWizardContainer', () => {
  let createMutationPayload: CreateManagedControlPlaneType | null = null;
  let updateMutationPayload: CreateManagedControlPlaneType | null = null;

  const fakeComponents = {
    metadata: {
      continue: '',
      resourceVersion: '67156443',
    },
    kind: 'ManagedComponentList',
    items: [
      {
        metadata: {
          creationTimestamp: '2025-10-24T08:48:05Z',
          generation: 1,
          resourceVersion: '66348667',
          managedFields: [
            {
              fieldsType: 'FieldsV1',
              manager: 'mcp-operator',
              operation: 'Update',
              fieldsV1: {
                'f:spec': {},
              },
              time: '2025-10-24T08:48:05Z',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
            },
            {
              operation: 'Update',
              time: '2025-10-24T09:03:05Z',
              fieldsType: 'FieldsV1',
              subresource: 'status',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
              fieldsV1: {
                'f:status': {
                  '.': {},
                  'f:versions': {},
                },
              },
              manager: 'mcp-operator',
            },
          ],
          name: 'crossplane',
          uid: '9cb38a64-390b-4b98-a36a-b5cbba5344f1',
        },
        spec: {},
        kind: 'ManagedComponent',
        status: {
          versions: [
            '1.15.0',
            '1.15.5',
            '1.16.0',
            '1.16.1',
            '1.16.2',
            '1.17.0',
            '1.17.1',
            '1.17.2',
            '1.17.3',
            '1.18.0',
            '1.18.1',
            '1.18.2',
            '1.18.3',
            '1.19.0',
          ],
        },
        apiVersion: 'core.openmcp.cloud/v1alpha1',
      },
      {
        metadata: {
          creationTimestamp: '2025-10-24T08:48:06Z',
          generation: 1,
          resourceVersion: '66348668',
          managedFields: [
            {
              fieldsType: 'FieldsV1',
              manager: 'mcp-operator',
              operation: 'Update',
              fieldsV1: {
                'f:spec': {},
              },
              time: '2025-10-24T08:48:06Z',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
            },
            {
              operation: 'Update',
              time: '2025-10-24T09:03:05Z',
              fieldsType: 'FieldsV1',
              subresource: 'status',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
              fieldsV1: {
                'f:status': {
                  '.': {},
                  'f:versions': {},
                },
              },
              manager: 'mcp-operator',
            },
          ],
          name: 'external-secrets',
          uid: '5eba35da-d213-4efd-9d58-2d1a6f08e400',
        },
        spec: {},
        kind: 'ManagedComponent',
        status: {
          versions: [
            '0.10.7',
            '0.11.0',
            '0.12.1',
            '0.13.0',
            '0.14.4',
            '0.15.1',
            '0.16.2',
            '0.17.0',
            '0.18.2',
            '0.19.2',
            '0.20.1',
            '0.8.0',
          ],
        },
        apiVersion: 'core.openmcp.cloud/v1alpha1',
      },
      {
        metadata: {
          creationTimestamp: '2025-10-24T08:48:06Z',
          generation: 1,
          resourceVersion: '66348669',
          managedFields: [
            {
              fieldsType: 'FieldsV1',
              manager: 'mcp-operator',
              operation: 'Update',
              fieldsV1: {
                'f:spec': {},
              },
              time: '2025-10-24T08:48:06Z',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
            },
            {
              operation: 'Update',
              time: '2025-10-24T09:03:05Z',
              fieldsType: 'FieldsV1',
              subresource: 'status',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
              fieldsV1: {
                'f:status': {
                  '.': {},
                  'f:versions': {},
                },
              },
              manager: 'mcp-operator',
            },
          ],
          name: 'flux',
          uid: '68d7b8f4-651e-4d6b-b864-08194ab36862',
        },
        spec: {},
        kind: 'ManagedComponent',
        status: {
          versions: ['2.15.0', '2.16.2'],
        },
        apiVersion: 'core.openmcp.cloud/v1alpha1',
      },
      {
        metadata: {
          creationTimestamp: '2025-10-24T08:48:07Z',
          generation: 1,
          resourceVersion: '66348674',
          managedFields: [
            {
              fieldsType: 'FieldsV1',
              manager: 'mcp-operator',
              operation: 'Update',
              fieldsV1: {
                'f:spec': {},
              },
              time: '2025-10-24T08:48:07Z',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
            },
            {
              operation: 'Update',
              time: '2025-10-24T09:03:06Z',
              fieldsType: 'FieldsV1',
              subresource: 'status',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
              fieldsV1: {
                'f:status': {
                  '.': {},
                  'f:versions': {},
                },
              },
              manager: 'mcp-operator',
            },
          ],
          name: 'provider-btp',
          uid: 'c889b1f7-8dfe-46f3-b8a5-9252587a2397',
        },
        spec: {},
        kind: 'ManagedComponent',
        status: {
          versions: ['1.0.0', '1.0.1', '1.0.2', '1.0.3', '1.1.0', '1.1.1', '1.1.2', '1.2.0', '1.2.1', '1.2.2', '1.3.0'],
        },
        apiVersion: 'core.openmcp.cloud/v1alpha1',
      },
      {
        metadata: {
          creationTimestamp: '2025-10-24T08:48:07Z',
          generation: 1,
          resourceVersion: '66348675',
          managedFields: [
            {
              fieldsType: 'FieldsV1',
              manager: 'mcp-operator',
              operation: 'Update',
              fieldsV1: {
                'f:spec': {},
              },
              time: '2025-10-24T08:48:07Z',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
            },
            {
              operation: 'Update',
              time: '2025-10-24T09:03:06Z',
              fieldsType: 'FieldsV1',
              subresource: 'status',
              apiVersion: 'core.openmcp.cloud/v1alpha1',
              fieldsV1: {
                'f:status': {
                  '.': {},
                  'f:versions': {},
                },
              },
              manager: 'mcp-operator',
            },
          ],
          name: 'provider-btp-account',
          uid: '96c96844-63da-4116-a2a3-35b2142cf765',
        },
        spec: {},
        kind: 'ManagedComponent',
        status: {
          versions: ['0.7.5', '0.7.6'],
        },
        apiVersion: 'core.openmcp.cloud/v1alpha1',
      },
    ],
    apiVersion: 'core.openmcp.cloud/v1alpha1',
  };
  const fakeUseCreateManagedControlPlane: typeof useCreateManagedControlPlane = () => ({
    mutate: async (data: CreateManagedControlPlaneType): Promise<CreateManagedControlPlaneType> => {
      createMutationPayload = data;
      return data;
    },
  });
  const fakeUseUpdateManagedControlPlane: typeof useUpdateManagedControlPlane = () => ({
    mutate: async (data: CreateManagedControlPlaneType): Promise<CreateManagedControlPlaneType> => {
      updateMutationPayload = data;
      return data;
    },
  });
  const fakeUseComponentsQuery: typeof useComponentsQuery = () => ({
    components: fakeComponents,
    error: undefined,
    isLoading: false,
  });
  const fakeUseAuthOnboarding = (() => ({
    user: {
      email: 'name@domain.com',
    },
  })) as typeof useAuthOnboarding;

  beforeEach(() => {
    createMutationPayload = null;
  });

  it('creates an empty MCP', () => {
    cy.mount(
      <CreateManagedControlPlaneWizardContainer
        useCreateManagedControlPlane={fakeUseCreateManagedControlPlane}
        useAuthOnboarding={fakeUseAuthOnboarding}
        useComponentsQuery={fakeUseComponentsQuery}
        isOpen={true}
        setIsOpen={() => {}}
      />,
    );

    const expMutationPayload: CreateManagedControlPlaneType = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: 'ManagedControlPlane',
      metadata: {
        name: 'mcp-empty',
        namespace: '--ws-',
        annotations: {
          'openmcp.cloud/display-name': '',
        },
        labels: {
          'openmcp.cloud.sap/charging-target-type': '',
          'openmcp.cloud.sap/charging-target': '',
        },
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        components: {
          apiServer: {
            type: 'GardenerDedicated',
          },
        },
        authorization: {
          roleBindings: [
            {
              role: 'admin',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:name@domain.com',
                },
              ],
            },
          ],
        },
      },
    };

    cy.get('#name').typeIntoUi5Input('mcp-empty');
    cy.get('ui5-button').contains('Next').click(); // navigate to Members
    cy.get('ui5-button').contains('Next').click(); // navigate to Component Selection
    cy.get('ui5-button').contains('Next').click(); // navigate to Summarize
    cy.get('ui5-button').contains('Create').click();
    cy.then(() => cy.wrap(createMutationPayload).deepEqualJson(expMutationPayload));
  });

  it('creates an MCP with installed components, members, and optional fields', () => {
    cy.mount(
      <CreateManagedControlPlaneWizardContainer
        useCreateManagedControlPlane={fakeUseCreateManagedControlPlane}
        useAuthOnboarding={fakeUseAuthOnboarding}
        useComponentsQuery={fakeUseComponentsQuery}
        isOpen={true}
        setIsOpen={() => {}}
      />,
    );

    const expMutationPayload: CreateManagedControlPlaneType = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: 'ManagedControlPlane',
      metadata: {
        name: 'name',
        namespace: '--ws-',
        annotations: {
          'openmcp.cloud/display-name': 'displayName',
        },
        labels: {
          'openmcp.cloud.sap/charging-target-type': 'BTP',
          'openmcp.cloud.sap/charging-target': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        },
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        components: {
          apiServer: {
            type: 'GardenerDedicated',
          },
          flux: {
            version: '2.15.0',
          },
          crossplane: {
            version: '1.19.0',
            providers: [],
          },
        },
        authorization: {
          roleBindings: [
            {
              role: 'admin',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:name@domain.com',
                },
              ],
            },
            {
              role: 'view',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:additionalUser',
                },
              ],
            },
          ],
        },
      },
    };

    cy.get('#name').typeIntoUi5Input('name');
    cy.get('#displayName').typeIntoUi5Input('displayName');
    cy.get('#chargingTargetType').openDropDownByClick();
    cy.get('#chargingTargetType').clickDropdownMenuItemByText<Cypress.TriggerOptions>('BTP');
    cy.get('#chargingTarget').typeIntoUi5Input('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').type('{enter}');

    cy.get('ui5-button').contains('Next').click(); // navigate to Members

    cy.get('ui5-button').contains('Add User or ServiceAccount').click();
    cy.get('#member-email-input').typeIntoUi5Input('additionalUser');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.SPACE); // close Add Member dialog

    cy.get('ui5-button').contains('Next').click(); // navigate to Component Selection

    // Select Crossplane and Flux v2.15.0
    cy.get('[ui5-checkbox][aria-label*="crossplane"]').toggleUi5Checkbox();
    cy.get('[ui5-checkbox][aria-label*="flux"]').toggleUi5Checkbox();
    cy.get('[ui5-select][aria-label*="flux"]').openDropDownByClick();
    cy.get('[ui5-select][aria-label*="flux"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>('2.15.0');
    cy.get('ui5-button').contains('Next').click(); // navigate to Summarize
    cy.get('ui5-button').contains('Create').click();
    cy.then(() => cy.wrap(createMutationPayload).deepEqualJson(expMutationPayload));
  });

  it('edits an existing MCP without any changes', () => {
    const existingMcp: ManagedControlPlaneInterface = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: 'ManagedControlPlane',
      metadata: {
        name: 'existing-mcp',
        namespace: 'project-existing-project--ws-existing-workspace',
        annotations: {
          'openmcp.cloud/created-by': 'name@domain.com',
          'openmcp.cloud/display-name': 'displayName',
        },
        labels: {
          'openmcp.cloud.sap/charging-target': 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          'openmcp.cloud.sap/charging-target-type': 'BTP',
          'openmcp.cloud/mcp-project': 'existing-project',
          'openmcp.cloud/mcp-workspace': 'existing-workspace',
        },
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        authorization: {
          roleBindings: [
            {
              role: 'admin',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:name@domain.com',
                },
              ],
            },
            {
              role: 'view',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:additionalUser',
                },
              ],
            },
          ],
        },
        components: {
          apiServer: {
            type: 'GardenerDedicated',
          },
          flux: {
            version: '2.15.0',
          },
          crossplane: {
            version: '1.19.0',
            providers: [],
          },
        },
      },
    };

    const expMutationPayload: CreateManagedControlPlaneType = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: 'ManagedControlPlane',
      metadata: {
        name: 'existing-mcp',
        namespace: '--ws-',
        annotations: {
          'openmcp.cloud/display-name': 'displayName',
        },
        labels: {
          'openmcp.cloud.sap/charging-target-type': 'btp',
          'openmcp.cloud.sap/charging-target': 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        },
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        components: {
          apiServer: {
            type: 'GardenerDedicated',
          },
          flux: {
            version: '2.15.0',
          },
          crossplane: {
            version: '1.19.0',
            providers: [],
          },
        },
        authorization: {
          roleBindings: [
            {
              role: 'admin',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:name@domain.com',
                },
              ],
            },
            {
              role: 'view',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:additionalUser',
                },
              ],
            },
          ],
        },
      },
    };

    cy.mount(
      <CreateManagedControlPlaneWizardContainer
        useUpdateManagedControlPlane={fakeUseUpdateManagedControlPlane}
        useAuthOnboarding={fakeUseAuthOnboarding}
        useComponentsQuery={fakeUseComponentsQuery}
        initialData={existingMcp}
        isEditMode={true}
        isOpen={true}
        setIsOpen={() => {}}
      />,
    );

    cy.get('ui5-button').contains('Next').click(); // navigate to Members
    cy.get('ui5-button').contains('Next').click(); // navigate to Component Selection
    cy.get('ui5-button').contains('Next').click(); // navigate to Summarize
    cy.get('ui5-button').contains('Update').click();
    cy.then(() => cy.wrap(updateMutationPayload).deepEqualJson(expMutationPayload));
  });

  it('edits an existing MCP with changes', () => {
    const existingMcp: ManagedControlPlaneInterface = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: 'ManagedControlPlane',
      metadata: {
        name: 'existing-mcp',
        namespace: 'project-existing-project--ws-existing-workspace',
        annotations: {
          'openmcp.cloud/created-by': 'name@domain.com',
          'openmcp.cloud/display-name': '',
        },
        labels: {
          'openmcp.cloud.sap/charging-target': '',
          'openmcp.cloud.sap/charging-target-type': '',
          'openmcp.cloud/mcp-project': 'existing-project',
          'openmcp.cloud/mcp-workspace': 'existing-workspace',
        },
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        authorization: {
          roleBindings: [
            {
              role: 'admin',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:name@domain.com',
                },
              ],
            },
          ],
        },
        components: {
          apiServer: {
            type: 'GardenerDedicated',
          },
        },
      },
    };

    const expMutationPayload: CreateManagedControlPlaneType = {
      apiVersion: 'core.openmcp.cloud/v1alpha1',
      kind: 'ManagedControlPlane',
      metadata: {
        name: 'existing-mcp',
        namespace: '--ws-',
        annotations: {
          'openmcp.cloud/display-name': 'displayName',
        },
        labels: {
          'openmcp.cloud.sap/charging-target-type': 'btp',
          'openmcp.cloud.sap/charging-target': 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        },
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        components: {
          apiServer: {
            type: 'GardenerDedicated',
          },
          flux: {
            version: '2.15.0',
          },
          crossplane: {
            version: '1.19.0',
            providers: [],
          },
        },
        authorization: {
          roleBindings: [
            {
              role: 'admin',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:name@domain.com',
                },
              ],
            },
            {
              role: 'view',
              subjects: [
                {
                  kind: 'User',
                  name: 'openmcp:additionalUser',
                },
              ],
            },
          ],
        },
      },
    };

    cy.mount(
      <CreateManagedControlPlaneWizardContainer
        useUpdateManagedControlPlane={fakeUseUpdateManagedControlPlane}
        useAuthOnboarding={fakeUseAuthOnboarding}
        useComponentsQuery={fakeUseComponentsQuery}
        initialData={existingMcp}
        isEditMode={true}
        isOpen={true}
        setIsOpen={() => {}}
      />,
    );

    cy.get('#displayName').typeIntoUi5Input('displayName');
    cy.get('#chargingTargetType').openDropDownByClick();
    cy.get('#chargingTargetType').clickDropdownMenuItemByText<Cypress.TriggerOptions>('BTP');
    cy.get('#chargingTarget').typeIntoUi5Input('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb').type('{enter}');

    cy.get('ui5-button').contains('Next').click(); // navigate to Members

    cy.get('ui5-button').contains('Add User or ServiceAccount').click();
    cy.get('#member-email-input').typeIntoUi5Input('additionalUser');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.SPACE); // close Add Member dialog

    cy.get('ui5-button').contains('Next').click(); // navigate to Component Selection

    // Select Crossplane and Flux v2.15.0
    cy.get('[ui5-checkbox][aria-label*="crossplane"]').toggleUi5Checkbox();
    cy.get('[ui5-checkbox][aria-label*="flux"]').toggleUi5Checkbox();
    cy.get('[ui5-select][aria-label*="flux"]').openDropDownByClick();
    cy.get('[ui5-select][aria-label*="flux"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>('2.15.0');
    cy.get('ui5-button').contains('Next').click(); // navigate to Summarize
    cy.get('ui5-button').contains('Update').click();
    cy.then(() => cy.wrap(updateMutationPayload).deepEqualJson(expMutationPayload));
  });
});
