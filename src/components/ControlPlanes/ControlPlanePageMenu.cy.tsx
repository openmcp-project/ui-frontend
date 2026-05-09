import { ControlPlanePageMenu } from './ControlPlanePageMenu.tsx';
import '@ui5/webcomponents-cypress-commands';

describe('ControlPlanePageMenu', () => {
  it('renders overflow button with transparent design', () => {
    const setIsEditManagedControlPlaneWizardOpen = cy.stub();

    cy.mount(
      <ControlPlanePageMenu setIsEditManagedControlPlaneWizardOpen={setIsEditManagedControlPlaneWizardOpen} />,
    );

    cy.get('ui5-button[icon="overflow"]').should('have.attr', 'design', 'Transparent');
  });

  it('shows edit menu item', () => {
    const setIsEditManagedControlPlaneWizardOpen = cy.stub();

    cy.mount(
      <ControlPlanePageMenu setIsEditManagedControlPlaneWizardOpen={setIsEditManagedControlPlaneWizardOpen} />,
    );

    cy.get('ui5-button[icon="overflow"]').click();
    cy.contains('Edit').should('be.visible');
  });

  it('calls edit handler when edit is clicked', () => {
    const setIsEditManagedControlPlaneWizardOpen = cy.stub();

    cy.mount(
      <ControlPlanePageMenu setIsEditManagedControlPlaneWizardOpen={setIsEditManagedControlPlaneWizardOpen} />,
    );

    cy.get('ui5-button[icon="overflow"]').click();
    cy.contains('Edit').click({ force: true });

    cy.then(() => {
      expect(setIsEditManagedControlPlaneWizardOpen).to.have.been.calledWith(true);
    });
  });

  it('shows YAML menu item when onYamlClick is provided', () => {
    const setIsEditManagedControlPlaneWizardOpen = cy.stub();
    const onYamlClick = cy.stub();

    cy.mount(
      <ControlPlanePageMenu
        setIsEditManagedControlPlaneWizardOpen={setIsEditManagedControlPlaneWizardOpen}
        onYamlClick={onYamlClick}
      />,
    );

    cy.get('ui5-button[icon="overflow"]').click();
    cy.contains('Show YAML').should('be.visible');
    cy.get('ui5-menu-item[icon="document-text"]').should('exist');
  });

  it('calls YAML handler when YAML is clicked', () => {
    const setIsEditManagedControlPlaneWizardOpen = cy.stub();
    const onYamlClick = cy.stub();

    cy.mount(
      <ControlPlanePageMenu
        setIsEditManagedControlPlaneWizardOpen={setIsEditManagedControlPlaneWizardOpen}
        onYamlClick={onYamlClick}
      />,
    );

    cy.get('ui5-button[icon="overflow"]').click();
    cy.contains('Show YAML').click({ force: true });

    cy.then(() => {
      expect(onYamlClick).to.have.been.called;
    });
  });

  it('does not show YAML menu item when onYamlClick is not provided', () => {
    const setIsEditManagedControlPlaneWizardOpen = cy.stub();

    cy.mount(
      <ControlPlanePageMenu setIsEditManagedControlPlaneWizardOpen={setIsEditManagedControlPlaneWizardOpen} />,
    );

    cy.get('ui5-button[icon="overflow"]').click();
    cy.contains('Show YAML').should('not.exist');
  });
});
