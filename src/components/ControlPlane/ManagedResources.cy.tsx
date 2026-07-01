/* eslint-disable @typescript-eslint/no-explicit-any */
import { ManagedResources } from './ManagedResources';
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

  const fakeUseApiResourceMutation: typeof useApiResourceMutation = (resource: any): any => {
    const isDelete = resource?.method === 'DELETE';
    return {
      data: undefined,
      error: undefined,
      reset: () => {},
      trigger: async (): Promise<any> => {
        if (isDelete) {
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

  const fakeUseHasMcpAdminRights = () => {
    return true;
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
  });

  it('deletes a managed resource', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources
            useApiResourceMutation={fakeUseApiResourceMutation}
            useApiResource={fakeUseApiResource}
            useResourcePluralNames={fakeUseResourcePluralNames}
            useHasMcpAdminRights={fakeUseHasMcpAdminRights}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Expand resource group
    cy.get('button[aria-label*="xpand"]').first().clickEnabled();
    cy.contains('test-subaccount').should('be.visible');

    // Open actions menu and click Delete
    cy.get('[data-testid="ActionsMenu-opener"]').first().clickEnabled();
    cy.contains('Delete').clickEnabled();

    // Type confirmation text and verify it was accepted
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5InputWithDelay('test-subaccount');
    cy.get('ui5-dialog[open]').find('ui5-input').should('have.prop', 'value', 'test-subaccount');

    // Verify delete not called yet
    cy.wrap(null).should(() => expect(deleteCalled).to.equal(false));

    // Wait for delete button to become enabled, then click
    cy.get('ui5-dialog[open]').find('ui5-button[design="Negative"]').should('not.have.attr', 'disabled');
    cy.get('ui5-dialog[open]').find('ui5-button[design="Negative"]').click();

    // Verify delete was called
    cy.wrap(null).should(() => expect(deleteCalled).to.equal(true));
  });

  it('force deletes a managed resource', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources
            useApiResourceMutation={fakeUseApiResourceMutation}
            useApiResource={fakeUseApiResource}
            useResourcePluralNames={fakeUseResourcePluralNames}
            useHasMcpAdminRights={fakeUseHasMcpAdminRights}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Expand resource group
    cy.get('button[aria-label*="xpand"]').first().clickEnabled();
    cy.contains('test-subaccount').should('be.visible');

    // Open actions menu and click Delete
    cy.get('[data-testid="ActionsMenu-opener"]').first().clickEnabled();
    cy.contains('Delete').clickEnabled();

    // Wait for dialog open animation to complete (onOpen fires resetForm
    // which clears state). Gate on the Advanced section being interactable
    // rather than a fixed cy.wait(500) — the timing depends on the animation
    // budget which varies across machines/CI.
    cy.openedDialog();
    cy.contains('Advanced').should('be.visible');

    // Expand Advanced section and enable force deletion checkbox
    cy.contains('Advanced').click();
    cy.get('ui5-dialog[open]').find('ui5-checkbox').toggleUi5Checkbox();
    cy.get('ui5-dialog[open]').find('ui5-checkbox').should('have.attr', 'checked');

    // Type confirmation text and verify it was accepted
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5InputWithDelay('test-subaccount');
    cy.get('ui5-dialog[open]').find('ui5-input').should('have.prop', 'value', 'test-subaccount');

    // Verify neither delete nor patch called yet
    cy.wrap(null).should(() => expect(deleteCalled).to.equal(false));
    cy.wrap(null).should(() => expect(patchCalled).to.equal(false));

    // Wait for delete button to become enabled, then click
    cy.get('ui5-dialog[open]').find('ui5-button[design="Negative"]').should('not.have.attr', 'disabled');
    cy.get('ui5-dialog[open]').find('ui5-button[design="Negative"]').click();

    // Verify both delete and patch were called
    cy.wrap(null).should(() => expect(deleteCalled).to.equal(true));
    cy.wrap(null).should(() => expect(patchCalled).to.equal(true));
  });

  it('keeps delete button disabled until confirmation text is entered', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources
            useApiResourceMutation={fakeUseApiResourceMutation}
            useApiResource={fakeUseApiResource}
            useResourcePluralNames={fakeUseResourcePluralNames}
            useHasMcpAdminRights={fakeUseHasMcpAdminRights}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Expand resource group
    cy.get('button[aria-label*="xpand"]').first().clickEnabled();
    cy.contains('test-subaccount').should('be.visible');

    // Open actions menu and click Delete
    cy.get('[data-testid="ActionsMenu-opener"]').first().clickEnabled();
    cy.contains('Delete').clickEnabled();

    // Delete button should be disabled initially
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').should('have.attr', 'disabled');

    // Type wrong text
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5InputWithDelay('wrong-text');

    // Delete button should still be disabled
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').should('have.attr', 'disabled');

    // Clear input and type correct text
    cy.get('ui5-dialog[open]').find('ui5-input').clearUi5Input();
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5InputWithDelay('test-subaccount');

    // Delete button should now be enabled
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').should('not.have.attr', 'disabled');
  });
});

describe('ManagedResources - Edit Resource', () => {
  let patchCalled = false;
  let patchedItem: any = null;

  const fakeUseHandleResourcePatch: typeof useHandleResourcePatch = () => {
    return async (item: any) => {
      patchCalled = true;
      patchedItem = item;
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

  const fakeUseHasMcpAdminRights = () => {
    return true;
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
    patchCalled = false;
    patchedItem = null;
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
              useHasMcpAdminRights={fakeUseHasMcpAdminRights}
            />
          </SplitterLayout>
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Expand resource group
    cy.get('button[aria-label*="xpand"]').first().clickEnabled();
    cy.contains('test-subaccount').should('be.visible');

    // Open actions menu and click Edit
    cy.get('[data-testid="ActionsMenu-opener"]').first().clickEnabled();
    cy.contains('Edit').clickEnabled();

    // Wait for YAML panel and Monaco editor to fully load (schema loader async re-renders)
    cy.contains('YAML').should('be.visible');
    cy.get('.monaco-editor', { timeout: 10000 }).should('exist');

    // Click Apply button — use force to avoid detached-DOM race from SWR revalidation re-renders
    cy.get('[data-testid="yaml-apply-button"]').clickEnabled();

    // Confirm in dialog
    cy.get('[data-testid="yaml-confirm-button"]', { timeout: 10000 }).should('be.visible').clickEnabled();

    // Wait for success message
    cy.contains('Update submitted', { timeout: 10000 }).should('be.visible');

    // Verify patch was called
    cy.wrap(null).should(() => expect(patchCalled).to.equal(true));
    cy.wrap(null).should(() => expect(patchedItem).to.not.be.null);
  });
});

describe('ManagedResources - Without Admin Rights', () => {
  const fakeUseHasMcpAdminRights = () => {
    return false;
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

  it('disables Edit and Delete actions when user has no admin rights', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources
            useApiResource={fakeUseApiResource}
            useResourcePluralNames={fakeUseResourcePluralNames}
            useHasMcpAdminRights={fakeUseHasMcpAdminRights}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Expand resource group
    cy.get('button[aria-label*="xpand"]').first().clickEnabled();
    cy.contains('test-subaccount').should('be.visible');

    // Open actions menu
    cy.get('[data-testid="ActionsMenu-opener"]').first().clickEnabled();

    // Verify Delete action is disabled by checking the ui5-menu-item element
    cy.get('ui5-menu-item[data-action-key="delete"]').should('have.attr', 'disabled');
  });
});

describe('ManagedResources', () => {
  const fakeUseHasMcpAdminRights = () => {
    return true;
  };

  const fakeUseResourcePluralNames: typeof useResourcePluralNames = (): any => {
    return {
      getPluralKind: (kind: string) => `${kind.toLowerCase()}s`,
      isLoading: false,
      error: undefined,
    };
  };

  const mockManagedResourcesWithKustomizationLabel: ManagedResourceGroup[] = [
    {
      items: [
        {
          apiVersion: 'example/v1',
          kind: 'SomeKind',
          metadata: {
            name: 'some-resource',
            namespace: 'default',
            creationTimestamp: '2024-01-01T00:00:00Z',
            labels: {
              'kustomize.toolkit.fluxcd.io/name': 'my-kustomization',
            },
          },
          spec: {},
          status: {
            conditions: [],
          },
        } as any,
      ],
    },
  ];

  const fakeUseApiResourceWithKustomizationLabel: typeof useApiResource = (): any => {
    return {
      data: mockManagedResourcesWithKustomizationLabel,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: async () => undefined,
    };
  };

  it('renders "Managed by Kustomization" column with link', () => {
    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ManagedResources
            useApiResource={fakeUseApiResourceWithKustomizationLabel}
            useResourcePluralNames={fakeUseResourcePluralNames}
            useHasMcpAdminRights={fakeUseHasMcpAdminRights}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    // Expand resource group (same pattern as other tests)
    cy.get('button[aria-label*="xpand"]').first().clickEnabled();
    cy.contains('some-resource').should('be.visible');

    // Link with label value should be rendered (ui5-link)
    cy.contains('ui5-link', 'my-kustomization').should('exist');

    // Clicking the link should not throw and triggers navigation handler
    cy.contains('ui5-link', 'my-kustomization').click();
  });
});
