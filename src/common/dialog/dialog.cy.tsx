import { useDialog } from './useDialog';
import { Dialog } from './Dialog.tsx';

function TestComponent() {
  const { isOpen, open, close } = useDialog();

  return (
    <div>
      <button data-cy="open-dialog" onClick={open}>
        Open Dialog
      </button>

      <Dialog isOpen={isOpen} data-cy="dialog" headerText="UI5 Dialog headerText" onClose={close}>
        <div data-cy="dialog-child">
          <p data-cy="dialog-content">Hello, this is dialog content!</p>
          <button data-cy="close-button" onClick={close}>
            Close
          </button>
        </div>
      </Dialog>
    </div>
  );
}

describe('<Dialog>', () => {
  beforeEach(() => {
    cy.mount(<TestComponent />);
  });

  it('should open and close dialog', () => {
    cy.get('[data-cy="dialog"]').should('not.be.visible');

    cy.get('[data-cy="open-dialog"]').click();

    cy.get('[data-cy="dialog"]').should('be.visible');

    cy.get('[data-cy="close-button"]').click();

    cy.get('[data-cy="dialog"]').should('not.be.visible');
  });

  it('should mount and dismount the children', () => {
    cy.get('[data-cy="dialog-child"]').should('not.exist');

    cy.get('[data-cy="open-dialog"]').click();

    cy.get('[data-cy="dialog-child"]').should('exist');
    cy.get('[data-cy="dialog-child"]').should('contain', 'Hello, this is dialog content!');

    cy.get('[data-cy="close-button"]').click();

    cy.get('[data-cy="dialog-child"]').should('not.exist');
  });

  it('should forward additional props to the UI5 dialog component', () => {
    cy.get('[data-cy="open-dialog"]').click();
    cy.get('header').should('contain', 'UI5 Dialog headerText');
  });
});
