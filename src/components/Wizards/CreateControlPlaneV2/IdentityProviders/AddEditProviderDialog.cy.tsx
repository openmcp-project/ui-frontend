import '@ui5/webcomponents-cypress-commands';
import { ExtraProviderMetadata } from '../../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { AddEditProviderDialog } from './AddEditProviderDialog.tsx';

describe('AddEditProviderDialog', () => {
  before(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('module is not defined')) return false;
    });
  });

  it('saves a new provider with the basic fields filled in', () => {
    let savedProvider: ExtraProviderMetadata | null = null;
    let savedIsEdit: boolean | null = null;
    let closeCalled = false;

    cy.mount(
      <AddEditProviderDialog
        open={true}
        existingProviders={[]}
        onClose={() => {
          closeCalled = true;
        }}
        onSave={(provider, isEdit) => {
          savedProvider = provider;
          savedIsEdit = isEdit;
        }}
      />,
    );

    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('custom');
    cy.get('[data-testid="provider-issuer-input"]').typeIntoUi5Input('https://example.com');
    cy.get('[data-testid="provider-client-id-input"]').typeIntoUi5Input('client-id-1');
    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add Identity Provider').click();

    cy.then(() => {
      cy.wrap(savedProvider).should('not.be.null');
      cy.wrap(savedProvider!.name).should('eq', 'custom');
      cy.wrap(savedProvider!.issuer).should('eq', 'https://example.com');
      cy.wrap(savedProvider!.clientID).should('eq', 'client-id-1');
      cy.wrap(savedIsEdit).should('eq', false);
      cy.wrap(closeCalled).should('eq', true);
    });
  });

  it('rejects the reserved provider name "system"', () => {
    cy.mount(<AddEditProviderDialog open={true} existingProviders={[]} onClose={() => {}} onSave={() => {}} />);

    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('system');
    cy.get('[data-testid="provider-issuer-input"]').typeIntoUi5Input('https://example.com');
    cy.get('[data-testid="provider-client-id-input"]').typeIntoUi5Input('client-id-1');
    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add Identity Provider').click();

    cy.contains("'system' is a reserved identity provider name.").should('exist');
  });

  it('rejects a duplicate provider name', () => {
    const existingProviders: ExtraProviderMetadata[] = [
      { name: 'custom', issuer: 'https://example.com', clientID: 'client-id-1' },
    ];

    cy.mount(
      <AddEditProviderDialog open={true} existingProviders={existingProviders} onClose={() => {}} onSave={() => {}} />,
    );

    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('custom');
    cy.get('[data-testid="provider-issuer-input"]').typeIntoUi5Input('https://example.com');
    cy.get('[data-testid="provider-client-id-input"]').typeIntoUi5Input('client-id-2');
    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add Identity Provider').click();

    cy.contains('An identity provider with this name already exists.').should('exist');
  });

  it('rejects an invalid issuer URL', () => {
    cy.mount(<AddEditProviderDialog open={true} existingProviders={[]} onClose={() => {}} onSave={() => {}} />);

    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('custom');
    cy.get('[data-testid="provider-issuer-input"]').typeIntoUi5Input('not-a-url');
    cy.get('[data-testid="provider-client-id-input"]').typeIntoUi5Input('client-id-1');
    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add Identity Provider').click();

    cy.contains('Must be a valid URL (e.g. https://example.com)').should('exist');
  });

  it('rejects a malformed provider name (uppercase letters are not allowed)', () => {
    cy.mount(<AddEditProviderDialog open={true} existingProviders={[]} onClose={() => {}} onSave={() => {}} />);

    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('Custom-IDP');
    cy.get('[data-testid="provider-issuer-input"]').typeIntoUi5Input('https://example.com');
    cy.get('[data-testid="provider-client-id-input"]').typeIntoUi5Input('client-id-1');
    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add Identity Provider').click();

    cy.contains('Use lowercase letters, numbers, hyphens (-), and dots (.)').should('exist');
  });

  it('prefills fields when editing an existing provider', () => {
    const providerToEdit: ExtraProviderMetadata = {
      name: 'custom',
      issuer: 'https://example.com',
      clientID: 'client-id-1',
      usernameClaim: 'email',
    };

    cy.mount(
      <AddEditProviderDialog
        open={true}
        existingProviders={[providerToEdit]}
        providerToEdit={providerToEdit}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    cy.get('[data-testid="provider-name-input"]').should('have.value', 'custom');
    cy.get('[data-testid="provider-issuer-input"]').should('have.value', 'https://example.com');
    cy.get('[data-testid="provider-client-id-input"]').should('have.value', 'client-id-1');
  });

  it('shows a rename warning when the name changes on a provider that already has members', () => {
    const providerToEdit: ExtraProviderMetadata = {
      name: 'custom',
      issuer: 'https://example.com',
      clientID: 'client-id-1',
    };

    cy.mount(
      <AddEditProviderDialog
        open={true}
        existingProviders={[providerToEdit]}
        providerToEdit={providerToEdit}
        memberCountForEditedProvider={2}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    cy.contains('Renaming this provider').should('not.exist');
    cy.get('[data-testid="provider-name-input"]').clearUi5Input();
    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('renamed');
    cy.contains('Renaming this provider changes the effective identity of its 2 existing member(s)').should('exist');
  });

  it('submits an edit with the previous name so callers can re-tag existing members', () => {
    const providerToEdit: ExtraProviderMetadata = {
      name: 'custom',
      issuer: 'https://example.com',
      clientID: 'client-id-1',
    };
    let savedProvider: ExtraProviderMetadata | null = null;
    let savedIsEdit: boolean | null = null;
    let savedPreviousName: string | undefined;

    cy.mount(
      <AddEditProviderDialog
        open={true}
        existingProviders={[providerToEdit]}
        providerToEdit={providerToEdit}
        onClose={() => {}}
        onSave={(provider, isEdit, previousName) => {
          savedProvider = provider;
          savedIsEdit = isEdit;
          savedPreviousName = previousName;
        }}
      />,
    );

    cy.get('[data-testid="provider-name-input"]').clearUi5Input();
    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('renamed');
    cy.get('[data-testid="save-provider-button"]').click();

    cy.then(() => {
      cy.wrap(savedProvider).should('not.be.null');
      cy.wrap(savedProvider!.name).should('eq', 'renamed');
      cy.wrap(savedIsEdit).should('eq', true);
      cy.wrap(savedPreviousName).should('eq', 'custom');
    });
  });

  it('round-trips the advanced settings panel (claims, prefixes, extra scopes)', () => {
    let savedProvider: ExtraProviderMetadata | null = null;

    cy.mount(
      <AddEditProviderDialog
        open={true}
        existingProviders={[]}
        onClose={() => {}}
        onSave={(provider) => {
          savedProvider = provider;
        }}
      />,
    );

    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('custom');
    cy.get('[data-testid="provider-issuer-input"]').typeIntoUi5Input('https://example.com');
    cy.get('[data-testid="provider-client-id-input"]').typeIntoUi5Input('client-id-1');

    cy.get('[data-testid="advanced-settings-panel"]').click();
    cy.get('[data-testid="provider-username-claim-input"]').typeIntoUi5Input('email');
    cy.get('[data-testid="provider-groups-claim-input"]').typeIntoUi5Input('groups');
    cy.get('[data-testid="provider-add-scope-button"]').click();
    cy.get('[data-testid="provider-extra-scope-input-0"]').typeIntoUi5Input('offline_access');

    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add Identity Provider').click();

    cy.then(() => {
      cy.wrap(savedProvider).should('not.be.null');
      cy.wrap(savedProvider!.usernameClaim).should('eq', 'email');
      cy.wrap(savedProvider!.groupsClaim).should('eq', 'groups');
      cy.wrap(savedProvider!.extraScopes).should('deep.equal', ['offline_access']);
    });
  });

  it('disabling the username/groups prefix checkboxes saves an explicit empty-string prefix', () => {
    let savedProvider: ExtraProviderMetadata | null = null;

    cy.mount(
      <AddEditProviderDialog
        open={true}
        existingProviders={[]}
        onClose={() => {}}
        onSave={(provider) => {
          savedProvider = provider;
        }}
      />,
    );

    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('custom');
    cy.get('[data-testid="provider-issuer-input"]').typeIntoUi5Input('https://example.com');
    cy.get('[data-testid="provider-client-id-input"]').typeIntoUi5Input('client-id-1');

    cy.get('[data-testid="advanced-settings-panel"]').click();
    cy.get('[data-testid="provider-disable-username-prefix-checkbox"]').click();
    cy.get('[data-testid="provider-disable-groups-prefix-checkbox"]').click();

    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add Identity Provider').click();

    cy.then(() => {
      cy.wrap(savedProvider).should('not.be.null');
      cy.wrap(savedProvider!.usernamePrefix).should('eq', '');
      cy.wrap(savedProvider!.groupsPrefix).should('eq', '');
    });
  });

  it('shows the implicit "<name>:" default as a placeholder on the prefix fields', () => {
    cy.mount(<AddEditProviderDialog open={true} existingProviders={[]} onClose={() => {}} onSave={() => {}} />);

    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('custom');
    cy.get('[data-testid="advanced-settings-panel"]').click();

    cy.get('[data-testid="provider-username-prefix-input"]').should('have.attr', 'placeholder', 'custom:');
    cy.get('[data-testid="provider-groups-prefix-input"]').should('have.attr', 'placeholder', 'custom:');
  });
});
