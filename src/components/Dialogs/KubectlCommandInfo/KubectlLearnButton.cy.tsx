import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog.tsx';
import { DeleteWorkspaceDialog } from './KubectlDeleteWorkspaceDialog.tsx';
import { KubectlDeleteMcpDialog } from './KubectlDeleteMcpDialog.tsx';
import { KubectlDeleteProjectDialog } from './KubectlDeleteProjectDialog.tsx';

describe('Kubectl learn button dialogs', () => {
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
    cy.get('ui5-dialog[open]').contains('Delete a Managed Control Plane').should('not.exist');
    cy.get('ui5-button').contains('Learn how to do this in code').should('be.visible').click();
    cy.get('ui5-dialog[open]').should('have.length', 2);
    cy.get('ui5-dialog[open]').contains('Delete a Managed Control Plane').should('be.visible');
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
