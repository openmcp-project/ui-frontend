/* eslint-disable @typescript-eslint/no-explicit-any */
import { ManagedResources } from './ManagedResources.tsx';
import { SplitterProvider } from '../Splitter/SplitterContext.tsx';
import { ManagedResourceGroup } from '../../lib/shared/types.ts';
import { MemoryRouter } from 'react-router-dom';
import { useApiResourceMutation } from '../../lib/api/useApiResource.ts';
import '@ui5/webcomponents-cypress-commands';
import { useHandleResourcePatch } from '../../lib/api/types/crossplane/useHandleResourcePatch.ts';

describe('ManagedResources - Delete Resource', () => {
  let deleteCalled = false;
  let patchCalled = false;
  let triggerCallCount = 0;

  const fakeUseApiResourceMutation: typeof useApiResourceMutation = (): any => {
    return {
      data: undefined,
      error: undefined,
      reset: () => {},
      trigger: async (): Promise<any> => {
        const currentTriggerCall = triggerCallCount++;
        if (currentTriggerCall === 0) {
          deleteCalled = true;
        } else {
          patchCalled = true;
        }
        return undefined;
      },
      isMutating: false,
    };
  };

  const mockManagedResources: ManagedResourceGroup[] = [
    {
      items: [
        {
          apiVersion: 'account.btp.sap.crossplane.io/v1alpha1',
          kind: 'Subaccount',
          metadata: {
            name: 'test-subaccount',
            namespace: 'test-namespace',
            creationTimestamp: '2024-01-01T00:00:00Z',
            resourceVersion: '1',
            labels: {},
          },
          spec: {},
          status: {
            conditions: [
              {
                type: 'Ready',
                status: 'True',
                lastTransitionTime: '2024-01-01T00:00:00Z',
              },
              {
                type: 'Synced',
                status: 'True',
                lastTransitionTime: '2024-01-01T00:00:00Z',
              },
            ],
          },
        } as any,
      ],
    },
  ];

  before(() => {
    // Set up interceptors once for all tests
    cy.intercept('GET', '**/managed', {
      statusCode: 200,
      body: mockManagedResources,
    }).as('getManagedResources');

    cy.intercept('GET', '**/customresourcedefinitions*', {
      statusCode: 200,
      body: {
        items: [
          {
            spec: {
              names: {
                kind: 'Subaccount',
                plural: 'subaccounts',
              },
            },
          },
        ],
      },
    }).as('getCRDs');
  });

  beforeEach(() => {
    deleteCalled = false;
    patchCalled = false;
    triggerCallCount = 0;
  });

  it('deletes a managed resource', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources useApiResourceMutation={fakeUseApiResourceMutation} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.wait('@getManagedResources');
    cy.wait('@getCRDs');

    cy.get('button[aria-label*="xpand"]').first().click({ force: true });
    cy.wait(500);

    cy.contains('test-subaccount').should('be.visible');
    cy.get('[data-testid="ActionsMenu-opener"]').first().click({ force: true });
    cy.contains('Delete').click({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('test-subaccount');

    cy.then(() => cy.wrap(deleteCalled).should('equal', false));
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
    cy.then(() => cy.wrap(deleteCalled).should('equal', true));
  });

  it('force deletes a managed resource', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources useApiResourceMutation={fakeUseApiResourceMutation} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.wait(1000);

    cy.get('button[aria-label*="xpand"]').first().click({ force: true });
    cy.wait(500);

    cy.contains('test-subaccount').should('be.visible');
    cy.get('[data-testid="ActionsMenu-opener"]').first().click({ force: true });
    cy.contains('Delete').click({ force: true });

    // Expand Advanced section
    cy.contains('Advanced').click();
    cy.wait(500);

    // Click directly on "Force deletion" text - this should toggle the checkbox
    cy.contains('Force deletion').click({ force: true });
    cy.wait(500);

    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('test-subaccount');

    cy.then(() => cy.wrap(deleteCalled).should('equal', false));
    cy.then(() => cy.wrap(patchCalled).should('equal', false));

    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();

    cy.wait(2000);

    cy.then(() => {
      cy.log(`deleteCalled: ${deleteCalled}, patchCalled: ${patchCalled}`);
    });

    cy.then(() => cy.wrap(deleteCalled).should('equal', true));
    cy.then(() => cy.wrap(patchCalled).should('equal', true));
  });

  it('keeps delete button disabled until confirmation text is entered', () => {
    // Setup interceptors for this test
    cy.intercept('GET', '**/managed', {
      statusCode: 200,
      body: mockManagedResources,
    }).as('getManagedResourcesValidation');

    cy.intercept('GET', '**/customresourcedefinitions*', {
      statusCode: 200,
      body: {
        items: [
          {
            spec: {
              names: {
                kind: 'Subaccount',
                plural: 'subaccounts',
              },
            },
          },
        ],
      },
    }).as('getCRDsValidation');

    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources useApiResourceMutation={fakeUseApiResourceMutation} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.wait('@getManagedResourcesValidation');
    cy.wait('@getCRDsValidation');

    cy.get('button[aria-label*="xpand"]').first().click({ force: true });
    cy.wait(500);

    cy.contains('test-subaccount').should('be.visible');
    cy.get('[data-testid="ActionsMenu-opener"]').first().click({ force: true });
    cy.contains('Delete').click({ force: true });

    // Delete button should be disabled initially
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').should('have.attr', 'disabled');

    // Type wrong text
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('wrong-text');
    cy.wait(300);

    // Delete button should still be disabled
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').should('have.attr', 'disabled');

    // Clear input by selecting all and deleting
    cy.get('ui5-dialog[open]').find('ui5-input').find('input[id*="inner"]').clear({ force: true });
    cy.wait(300);

    // Type correct text
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('test-subaccount');
    cy.wait(300);

    // Delete button should now be enabled
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').should('not.have.attr', 'disabled');
  });
});

describe('ManagedResources - Edit Resource', () => {
  let patchHandlerCreated = false;

  const fakeUseHandleResourcePatch: typeof useHandleResourcePatch = () => {
    patchHandlerCreated = true;
    return async () => {
      return true;
    };
  };

  const mockManagedResources: ManagedResourceGroup[] = [
    {
      items: [
        {
          apiVersion: 'account.btp.sap.crossplane.io/v1alpha1',
          kind: 'Subaccount',
          metadata: {
            name: 'test-subaccount',
            namespace: 'test-namespace',
            creationTimestamp: '2024-01-01T00:00:00Z',
            resourceVersion: '1',
            labels: {},
          },
          spec: {},
          status: {
            conditions: [
              {
                type: 'Ready',
                status: 'True',
                lastTransitionTime: '2024-01-01T00:00:00Z',
              },
              {
                type: 'Synced',
                status: 'True',
                lastTransitionTime: '2024-01-01T00:00:00Z',
              },
            ],
          },
        } as any,
      ],
    },
  ];

  before(() => {
    cy.intercept('GET', '**/managed', {
      statusCode: 200,
      body: mockManagedResources,
    }).as('getManagedResources');

    cy.intercept('GET', '**/customresourcedefinitions*', {
      statusCode: 200,
      body: {
        items: [
          {
            spec: {
              names: {
                kind: 'Subaccount',
                plural: 'subaccounts',
              },
            },
          },
        ],
      },
    }).as('getCRDs');
  });

  beforeEach(() => {
    patchHandlerCreated = false;
  });

  it('initializes patch handler and edit button is available', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources useHandleResourcePatch={fakeUseHandleResourcePatch} />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.wait('@getManagedResources');
    cy.wait('@getCRDs');

    // Verify patch handler was initialized
    cy.then(() => cy.wrap(patchHandlerCreated).should('equal', true));

    cy.get('button[aria-label*="xpand"]').first().click({ force: true });
    cy.wait(500);

    cy.contains('test-subaccount').should('be.visible');
    cy.get('[data-testid="ActionsMenu-opener"]').first().click({ force: true });

    // Verify Edit button exists
    cy.contains('Edit').should('exist');

    // Verify Edit button is not disabled (check separately)
    cy.contains('Edit').should('not.have.attr', 'disabled');

    // Click Edit button
    cy.contains('Edit').click({ force: true });
  });
});
