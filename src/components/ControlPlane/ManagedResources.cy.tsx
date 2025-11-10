/* eslint-disable @typescript-eslint/no-explicit-any */
import { ManagedResources } from './ManagedResources.tsx';
import { SplitterProvider } from '../Splitter/SplitterContext.tsx';
import { ManagedResourceGroup } from '../../lib/shared/types.ts';
import { MemoryRouter } from 'react-router-dom';
import { useApiResourceMutation, useApiResource } from '../../lib/api/useApiResource.ts';
import '@ui5/webcomponents-cypress-commands';
import { useHandleResourcePatch } from '../../hooks/useHandleResourcePatch.ts';
import { SplitterLayout } from '../Splitter/SplitterLayout.tsx';
import { useResourcePluralNames } from '../../hooks/useResourcePluralNames';

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

  const fakeUseApiResource: typeof useApiResource = (): any => {
    return {
      data: mockManagedResources,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: async () => undefined,
    };
  };

  const fakeUseResourcePluralNames: typeof useResourcePluralNames = (): any => {
    return {
      getPluralKind: (kind: string) => `${kind.toLowerCase()}s`,
      isLoading: false,
      error: undefined,
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

  beforeEach(() => {
    deleteCalled = false;
    patchCalled = false;
    triggerCallCount = 0;
  });

  it('deletes a managed resource', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources
            useApiResourceMutation={fakeUseApiResourceMutation}
            useApiResource={fakeUseApiResource}
            useResourcePluralNames={fakeUseResourcePluralNames}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Expand resource group
    cy.get('button[aria-label*="xpand"]').first().click({ force: true });
    cy.contains('test-subaccount').should('be.visible');

    // Open actions menu and click Delete
    cy.get('[data-testid="ActionsMenu-opener"]').first().click({ force: true });
    cy.contains('Delete').click({ force: true });

    // Type confirmation text
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('test-subaccount');

    // Verify delete not called yet
    cy.then(() => cy.wrap(deleteCalled).should('equal', false));

    // Click delete button
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();

    // Verify delete was called
    cy.then(() => cy.wrap(deleteCalled).should('equal', true));
  });

  it('force deletes a managed resource', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources
            useApiResourceMutation={fakeUseApiResourceMutation}
            useApiResource={fakeUseApiResource}
            useResourcePluralNames={fakeUseResourcePluralNames}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Expand resource group
    cy.get('button[aria-label*="xpand"]').first().click({ force: true });
    cy.contains('test-subaccount').should('be.visible');

    // Open actions menu and click Delete
    cy.get('[data-testid="ActionsMenu-opener"]').first().click({ force: true });
    cy.contains('Delete').click({ force: true });

    // Expand Advanced section
    cy.contains('Advanced').click();

    // Enable force deletion checkbox
    cy.contains('Force deletion').click({ force: true });

    // Type confirmation text
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('test-subaccount');

    // Verify neither delete nor patch called yet
    cy.then(() => cy.wrap(deleteCalled).should('equal', false));
    cy.then(() => cy.wrap(patchCalled).should('equal', false));

    // Click delete button
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();

    // Verify both delete and patch were called
    cy.then(() => cy.wrap(deleteCalled).should('equal', true));
    cy.then(() => cy.wrap(patchCalled).should('equal', true));
  });

  it('keeps delete button disabled until confirmation text is entered', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources
            useApiResourceMutation={fakeUseApiResourceMutation}
            useApiResource={fakeUseApiResource}
            useResourcePluralNames={fakeUseResourcePluralNames}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Expand resource group
    cy.get('button[aria-label*="xpand"]').first().click({ force: true });
    cy.contains('test-subaccount').should('be.visible');

    // Open actions menu and click Delete
    cy.get('[data-testid="ActionsMenu-opener"]').first().click({ force: true });
    cy.contains('Delete').click({ force: true });

    // Delete button should be disabled initially
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').should('have.attr', 'disabled');

    // Type wrong text
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('wrong-text');

    // Delete button should still be disabled
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').should('have.attr', 'disabled');

    // Clear input and type correct text
    cy.get('ui5-dialog[open]').find('ui5-input').find('input[id*="inner"]').clear({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('test-subaccount');

    // Delete button should now be enabled
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').should('not.have.attr', 'disabled');
  });
});

describe('ManagedResources - Edit Resource', () => {
  const state = {
    patchHandlerCreated: false,
    patchCalled: false,
    patchedItem: null as any,
  };

  const fakeUseHandleResourcePatch: typeof useHandleResourcePatch = () => {
    state.patchHandlerCreated = true;
    return async (item: any) => {
      state.patchCalled = true;
      state.patchedItem = item;
      return true;
    };
  };

  const fakeUseApiResource: typeof useApiResource = (): any => {
    return {
      data: mockManagedResources,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: async () => undefined,
    };
  };

  const fakeUseResourcePluralNames: typeof useResourcePluralNames = (): any => {
    return {
      getPluralKind: (kind: string) => `${kind.toLowerCase()}s`,
      isLoading: false,
      error: undefined,
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
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('TextModel got disposed')) {
        return false;
      }
      if (err.message.includes('DiffEditorWidget')) {
        return false;
      }
      return true;
    });
  });

  beforeEach(() => {
    state.patchHandlerCreated = false;
    state.patchCalled = false;
    state.patchedItem = null;
  });

  it('opens edit panel and can apply changes', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <SplitterLayout>
            <ManagedResources
              useHandleResourcePatch={fakeUseHandleResourcePatch}
              useApiResource={fakeUseApiResource}
              useResourcePluralNames={fakeUseResourcePluralNames}
            />
          </SplitterLayout>
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Verify patch handler was initialized
    cy.then(() => cy.wrap(state.patchHandlerCreated).should('equal', true));

    // Expand resource group
    cy.get('button[aria-label*="xpand"]').first().click({ force: true });
    cy.contains('test-subaccount').should('be.visible');

    // Open actions menu and click Edit
    cy.get('[data-testid="ActionsMenu-opener"]').first().click({ force: true });
    cy.contains('Edit').click({ force: true });

    // Verify YAML panel opened
    cy.contains('YAML').should('be.visible');

    // Verify patch not called yet
    cy.then(() => cy.wrap(state.patchCalled).should('equal', false));

    // Click Apply button
    cy.get('[data-testid="yaml-apply-button"]').should('be.visible').click();

    // Confirm in dialog
    cy.get('[data-testid="yaml-confirm-button"]', { timeout: 10000 }).should('be.visible').click({ force: true });

    // Wait for success message
    cy.contains('Update submitted', { timeout: 10000 }).should('be.visible');

    // Verify patch was called - use should callback to access current value
    cy.wrap(state).its('patchCalled').should('equal', true);
    cy.wrap(state).its('patchedItem').should('not.be.null');
  });
});