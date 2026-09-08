import '@ui5/webcomponents-cypress-commands';
import { DeleteProviderConfirmationDialog } from './DeleteProviderConfirmationDialog.tsx';

describe('DeleteProviderConfirmationDialog', () => {
  before(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('module is not defined')) return false;
    });
  });

  it('shows the no-members message when the provider has no members', () => {
    cy.mount(
      <DeleteProviderConfirmationDialog
        open={true}
        providerName="custom"
        memberCount={0}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );

    cy.contains("Are you sure you want to delete the identity provider 'custom'? It has no members.").should('exist');
  });

  it('shows the singular message when the provider has exactly one member', () => {
    cy.mount(
      <DeleteProviderConfirmationDialog
        open={true}
        providerName="custom"
        memberCount={1}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );

    cy.contains('Its 1 member will also be removed').should('exist');
  });

  it('shows the plural message when the provider has multiple members', () => {
    cy.mount(
      <DeleteProviderConfirmationDialog
        open={true}
        providerName="custom"
        memberCount={3}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );

    cy.contains('Its 3 members will also be removed').should('exist');
  });

  it('calls onCancel and not onConfirm when Cancel is clicked', () => {
    let cancelled = false;
    let confirmed = false;

    cy.mount(
      <DeleteProviderConfirmationDialog
        open={true}
        providerName="custom"
        memberCount={1}
        onCancel={() => {
          cancelled = true;
        }}
        onConfirm={() => {
          confirmed = true;
        }}
      />,
    );

    cy.get('ui5-dialog[open]').contains('ui5-button', 'Cancel').click();

    cy.then(() => {
      cy.wrap(cancelled).should('eq', true);
      cy.wrap(confirmed).should('eq', false);
    });
  });

  it('calls onConfirm when the delete button is clicked', () => {
    let confirmed = false;

    cy.mount(
      <DeleteProviderConfirmationDialog
        open={true}
        providerName="custom"
        memberCount={1}
        onCancel={() => {}}
        onConfirm={() => {
          confirmed = true;
        }}
      />,
    );

    cy.get('[data-testid="confirm-delete-provider-button"]').click();

    cy.then(() => {
      cy.wrap(confirmed).should('eq', true);
    });
  });
});
