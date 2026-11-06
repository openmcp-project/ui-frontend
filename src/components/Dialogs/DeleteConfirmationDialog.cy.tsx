import { DeleteConfirmationDialog } from './DeleteConfirmationDialog.tsx';
import { DeleteWorkspaceDialog } from './KubectlCommandInfo/KubectlDeleteWorkspaceDialog.tsx';
import { KubectlDeleteMcpDialog } from './KubectlCommandInfo/KubectlDeleteMcpDialog.tsx';
import { KubectlDeleteProjectDialog } from './KubectlCommandInfo/KubectlDeleteProjectDialog.tsx';

describe('DeleteConfirmationDialog', () => {
  // Helper function to mount the component with different props
  const mountDialog = (props = {}) => {
    cy.mount(
      <DeleteConfirmationDialog
        isOpen={true}
        setIsOpen={cy.stub().as('setIsOpen')}
        resourceName="test-resource"
        kubectlDialog={({ isOpen, onClose }) => (
          <button type="button" data-testid="kubectl-dialog" data-open={isOpen} onClick={onClose} />
        )}
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

    cy.contains('You are about to delete the resource').should('be.visible');
    cy.contains('test-resource').should('be.visible');
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

    cy.get('ui5-input[id*="delete-confirm-input"]').find(' input[id*="inner"]').type('test-resource', { force: true });

    cy.get('ui5-button').contains('Delete').should('not.have.attr', 'disabled');
  });

  it('should keep Delete button disabled when incorrect name is typed', () => {
    mountDialog();

    cy.get('ui5-input[id*="delete-confirm-input"]').find(' input[id*="inner"]').type('wrong-name', { force: true });

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

    cy.get('ui5-input[id*="delete-confirm-input"]').find(' input[id*="inner"]').type('test-resource');

    cy.get('ui5-button').contains('Delete').click();

    cy.get('@setIsOpen').should('have.been.calledWith', false);

    cy.get('@onDeletionConfirmed').should('have.been.calledOnce');
  });

  it('should clear input when dialog is reopened', () => {
    // Mount with isOpen=true
    mountDialog();

    // Type something
    cy.get('ui5-input[id*="delete-confirm-input"]').find(' input[id*="inner"]').type('test-resource', { force: true });

    // Close dialog
    cy.get('ui5-button').contains('Cancel').click();

    // Reopen dialog
    mountDialog();

    cy.get('ui5-input[id*="delete-confirm-input"]').find(' input[id*="inner"]').should('have.value', '');
  });

  it('should display correct resource name in all labels', () => {
    mountDialog({ resourceName: 'custom-resource' });

    cy.contains('You are about to delete the resource').should('be.visible');
    cy.contains('custom-resource').should('be.visible');

    cy.contains('Type the name to confirm').should('be.visible');
  });

  it('should copy the resource name to clipboard when the copy button is clicked', () => {
    cy.window().then((win) => {
      const writeTextStub = cy.stub().resolves();
      Object.defineProperty(win.navigator, 'clipboard', {
        value: { writeText: writeTextStub, readText: cy.stub().resolves('') },
        writable: true,
        configurable: true,
      });
    });

    mountDialog({ resourceName: 'custom-resource' });

    cy.get('ui5-button[icon="copy"]').click();

    cy.window().then((win) => {
      expect(win.navigator.clipboard.writeText).to.have.been.calledWith('custom-resource');
    });
  });

  describe('force delete', () => {
    const mountForceDialog = (props = {}) => {
      cy.mount(
        <DeleteConfirmationDialog
          isOpen={true}
          setIsOpen={cy.stub().as('setIsOpen')}
          resourceName="test-resource"
          forceDelete={{ onForceDeletionConfirmed: cy.stub().as('onForceDeletionConfirmed') }}
          onDeletionConfirmed={cy.stub().as('onDeletionConfirmed')}
          {...props}
        />,
      );
    };

    it('does not show the force-delete option when no forceDelete config is provided', () => {
      mountDialog();

      cy.get('[data-testid="force-delete-toggle"]').should('not.exist');
    });

    it('reveals the warning and acknowledgement only after enabling force delete', () => {
      mountForceDialog();

      cy.get('[data-testid="force-delete-warning"]').should('not.exist');
      cy.get('[data-testid="force-delete-acknowledge"]').should('not.exist');

      cy.get('[data-testid="force-delete-toggle"]').find('input').check({ force: true });

      cy.get('[data-testid="force-delete-warning"]').should('be.visible');
      cy.get('[data-testid="force-delete-acknowledge"]').should('be.visible');
      cy.get('ui5-button').contains('Force Delete').should('be.visible');
    });

    it('keeps the action disabled until the name is typed and the risk is acknowledged', () => {
      mountForceDialog();

      cy.get('[data-testid="force-delete-toggle"]').find('input').check({ force: true });

      // name typed but not acknowledged
      cy.get('ui5-input[id*="delete-confirm-input"]')
        .find(' input[id*="inner"]')
        .type('test-resource', { force: true });
      cy.get('ui5-button').contains('Force Delete').should('have.attr', 'disabled');

      // acknowledged -> enabled
      cy.get('[data-testid="force-delete-acknowledge"]').find('input').check({ force: true });
      cy.get('ui5-button').contains('Force Delete').should('not.have.attr', 'disabled');
    });

    it('calls onForceDeletionConfirmed (not the regular deletion) when force delete is confirmed', () => {
      mountForceDialog();

      cy.get('[data-testid="force-delete-toggle"]').find('input').check({ force: true });
      cy.get('ui5-input[id*="delete-confirm-input"]')
        .find(' input[id*="inner"]')
        .type('test-resource', { force: true });
      cy.get('[data-testid="force-delete-acknowledge"]').find('input').check({ force: true });

      cy.get('ui5-button').contains('Force Delete').click();

      cy.get('@onForceDeletionConfirmed').should('have.been.calledOnce');
      cy.get('@onDeletionConfirmed').should('not.have.been.called');
      cy.get('@setIsOpen').should('have.been.calledWith', false);
    });
  });

  describe('kubectl learn button dialogs', () => {
    it('opens Delete Workspace kubectl dialog only after clicking Learn button', () => {
      cy.mount(
        <DeleteConfirmationDialog
          isOpen={true}
          setIsOpen={cy.stub()}
          resourceName="test-workspace"
          kubectlDialog={({ isOpen, onClose }) => (
            <DeleteWorkspaceDialog projectName="demo" resourceName="test-workspace" isOpen={isOpen} onClose={onClose} />
          )}
        />,
      );

      cy.get('ui5-dialog[open]').should('have.length', 1);
      cy.get('ui5-dialog[open]').contains('Delete a Workspace').should('not.exist');
      cy.get('ui5-button').contains('Learn how to do this in code').should('be.visible').click();
      cy.get('ui5-dialog[open]').should('have.length', 2);
      cy.get('ui5-dialog[open]').contains('Delete a Workspace').should('be.visible');
    });

    it('opens Delete MCP kubectl dialog only after clicking Learn button', () => {
      cy.mount(
        <DeleteConfirmationDialog
          isOpen={true}
          setIsOpen={cy.stub()}
          resourceName="mcp-ui"
          kubectlDialog={({ isOpen, onClose }) => (
            <KubectlDeleteMcpDialog
              projectName="demo"
              workspaceName="demo-workspace"
              resourceName="mcp-ui"
              isOpen={isOpen}
              onClose={onClose}
            />
          )}
        />,
      );

      cy.get('ui5-dialog[open]').should('have.length', 1);
      cy.get('ui5-dialog[open]').contains('Delete a Control Plane').should('not.exist');
      cy.get('ui5-button').contains('Learn how to do this in code').should('be.visible').click();
      cy.get('ui5-dialog[open]').should('have.length', 2);
      cy.get('ui5-dialog[open]').contains('Delete a Control Plane').should('be.visible');
    });

    it('opens Delete Project kubectl dialog only after clicking Learn button', () => {
      cy.mount(
        <DeleteConfirmationDialog
          isOpen={true}
          setIsOpen={cy.stub()}
          resourceName="demo-project"
          kubectlDialog={({ isOpen, onClose }) => (
            <KubectlDeleteProjectDialog projectName="demo-project" isOpen={isOpen} onClose={onClose} />
          )}
        />,
      );

      cy.get('ui5-dialog[open]').should('have.length', 1);
      cy.get('ui5-dialog[open]').contains('Delete a Project').should('not.exist');
      cy.get('ui5-button').contains('Learn how to do this in code').should('be.visible').click();
      cy.get('ui5-dialog[open]').should('have.length', 2);
      cy.get('ui5-dialog[open]').contains('Delete a Project').should('be.visible');
    });
  });
});
