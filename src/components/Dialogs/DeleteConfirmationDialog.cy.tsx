import { DeleteConfirmationDialog } from './DeleteConfirmationDialog.tsx';

describe('DeleteConfirmationDialog', () => {
  // Helper function to mount the component with different props
  const mountDialog = (props = {}) => {
    cy.mount(
      <DeleteConfirmationDialog
        isOpen={true}
        setIsOpen={cy.stub().as('setIsOpen')}
        resourceName="test-resource"
        kubectl={<div>Resource Component</div>}
        onDeletionConfirmed={cy.stub().as('onDeletionConfirmed')}
        onCanceled={cy.stub().as('onCanceled')}
        {...props}
      />,
      {},
    );
  };

  it('should display dialog when isOpen is true', () => {
    mountDialog();

    cy.get('ui5-dialog').should('be.visible').should('have.attr', 'open');

    cy.contains('Delete test-resource').should('be.visible');

    cy.contains('You are about to delete the resource test-resource').should('be.visible');
  });

  it('should not be visible when isOpen is false', () => {
    mountDialog({ isOpen: false });

    cy.get('ui5-dialog').should('not.have.attr', 'open');
  });

  it('should disable Delete button by default', () => {
    mountDialog();

    cy.get('ui5-button').contains('Delete').should('have.attr', 'disabled');
  });

  it('should enable Delete button when correct resource name is typed', () => {
    mountDialog();

    cy.get('ui5-input[id*="mcp-name-input"]').find(' input[id*="inner"]').type('test-resource', { force: true });

    cy.get('ui5-button').contains('Delete').should('not.have.attr', 'disabled');
  });

  it('should keep Delete button disabled when incorrect name is typed', () => {
    mountDialog();

    cy.get('ui5-input[id*="mcp-name-input"]').find(' input[id*="inner"]').type('wrong-name', { force: true });

    cy.get('ui5-button').contains('Delete').should('have.attr', 'disabled');
  });

  it('should call onCanceled and setIsOpen when Cancel is clicked', () => {
    mountDialog();

    cy.get('ui5-button').contains('Cancel').click();

    cy.get('@setIsOpen').should('have.been.calledWith', false);

    cy.get('@onCanceled').should('have.been.calledOnce');
  });

  it('should call onDeletionConfirmed and setIsOpen when Delete is confirmed', () => {
    mountDialog();

    cy.get('ui5-input[id*="mcp-name-input"]').find(' input[id*="inner"]').type('test-resource');

    cy.get('ui5-button').contains('Delete').click();

    cy.get('@setIsOpen').should('have.been.calledWith', false);

    cy.get('@onDeletionConfirmed').should('have.been.calledOnce');
  });

  it('should clear input when dialog is reopened', () => {
    // Mount with isOpen=true
    mountDialog();

    // Type something
    cy.get('ui5-input[id*="mcp-name-input"]').find(' input[id*="inner"]').type('test-resource', { force: true });

    // Close dialog
    cy.get('ui5-button').contains('Cancel').click();

    // Reopen dialog
    mountDialog();

    cy.get('ui5-input[id*="mcp-name-input"]').find(' input[id*="inner"]').should('have.value', '');
  });

  it('should display correct resource name in all labels', () => {
    mountDialog({ resourceName: 'custom-resource' });

    cy.contains('You are about to delete the resource custom-resource.').should('be.visible');

    cy.contains('To confirm, type “custom-resource” in the box below').should('be.visible');
  });
});
