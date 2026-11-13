import '@ui5/webcomponents-cypress-commands';
import { ServiceIcon } from './ServiceIcon.tsx';

describe('ServiceIcon tooltips', () => {
  it('prefixes the service name on the error tooltip', () => {
    cy.mount(
      <ServiceIcon
        name="Crossplane"
        title="Crossplane"
        logo=""
        phase="Progressing"
        errorMessage="abc"
        lifecycleEnabled
        onClick={() => {}}
      />,
    );
    cy.get('[data-testid="component-icon-Crossplane"]').should('have.attr', 'title', 'Crossplane - Error abc');
  });

  it('prefixes the service name on the major update tooltip', () => {
    cy.mount(
      <ServiceIcon
        name="Crossplane"
        title="Crossplane"
        logo=""
        phase="Ready"
        updateDiff="major"
        lifecycleEnabled
        onClick={() => {}}
      />,
    );
    cy.get('ui5-icon[accessible-name="Crossplane - major update available"]').should('exist');
  });

  it('prefixes the service name on the minor update tooltip', () => {
    cy.mount(
      <ServiceIcon
        name="Crossplane"
        title="Crossplane"
        logo=""
        phase="Ready"
        updateDiff="minor"
        lifecycleEnabled
        onClick={() => {}}
      />,
    );
    cy.get('ui5-icon[accessible-name="Crossplane - minor update available"]').should('exist');
  });

  it('prefixes the service name on the patch update tooltip', () => {
    cy.mount(
      <ServiceIcon
        name="Crossplane"
        title="Crossplane"
        logo=""
        phase="Ready"
        updateDiff="patch"
        lifecycleEnabled
        onClick={() => {}}
      />,
    );
    cy.get('ui5-icon[accessible-name="Crossplane - patch update available"]').should('exist');
  });
});
