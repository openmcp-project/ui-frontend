import { ComponentsDashboard, ComponentsDashboardProps } from './ComponentsDashboard.tsx';

describe('ComponentsDashboard', () => {
  const mount = (props?: Partial<ComponentsDashboardProps>) => {
    const components = {} as unknown as ComponentsDashboardProps['components'];

    cy.mount(
      <ComponentsDashboard
        components={components}
        onInstallButtonClick={() => {}}
        onNavigateToMcpSection={() => {}}
        {...props}
      />,
      {},
    );
  };

  it('renders all component cards with names, descriptions, and versions', () => {
    mount();

    cy.get('.ui5-card-header').should('have.length', 6);

    cy.get('.ui5-card-header')
      .eq(0)
      .should('contain.text', 'Crossplane')
      .and('contain.text', 'Compose cloud infrastructure');

    cy.get('.ui5-card-header')
      .eq(1)
      .should('contain.text', 'Flux')
      .and('contain.text', 'GitOps for Kubernetes automating continuous sync and delivery');

    cy.get('.ui5-card-header')
      .eq(2)
      .should('contain.text', 'Landscaper')
      .and('contain.text', 'Automate cross‑dependent Kubernetes deployments');

    cy.get('.ui5-card-header')
      .eq(3)
      .should('contain.text', 'Kyverno')
      .and('contain.text', 'Kubernetes-native policy as code for secure and compliant infrastructure');

    cy.get('.ui5-card-header')
      .eq(4)
      .should('contain.text', 'External Secrets Operator')
      .and('contain.text', 'Manage and sync credentials from your secret store');

    cy.get('.ui5-card-header')
      .eq(5)
      .should('contain.text', 'Velero')
      .and('contain.text', 'Safely back up, restore, recover, and migrate Kubernetes resources');
  });

  it('calls onInstallButtonClick when Install is clicked on each card', () => {
    mount({
      onInstallButtonClick: cy.stub().as('onInstall'),
    });

    cy.contains('ui5-card', 'Crossplane').within(() => {
      cy.contains('Install').click();
    });
    cy.contains('ui5-card', 'Flux').within(() => {
      cy.contains('Install').click();
    });
    cy.contains('ui5-card', 'Kyverno').within(() => {
      cy.contains('Install').click();
    });
    cy.contains('ui5-card', 'External Secrets Operator').within(() => {
      cy.contains('Install').click();
    });
    cy.contains('ui5-card', 'Velero').within(() => {
      cy.contains('Install').click();
    });

    cy.get('@onInstall').should('have.callCount', 5);
  });
});
