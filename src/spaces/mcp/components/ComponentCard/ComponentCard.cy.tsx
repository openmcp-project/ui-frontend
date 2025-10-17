import { ComponentCard, ComponentCardProps } from './ComponentCard';

describe('ComponentCard', () => {
  const mount = (props: ComponentCardProps) => {
    cy.mount(<ComponentCard {...props} />, {});
  };

  it('renders an installed component', () => {
    const props: ComponentCardProps = {
      name: 'COMPONENT NAME',
      description: 'COMPONENT DESCRIPTION',
      logoImgSrc: '/logo.png',
      isInstalled: true,
      version: '1.2.3',
      onNavigateToComponentSection: cy.stub().as('onNavigate'),
      onInstallButtonClick: cy.stub().as('onInstall'),
      kpiType: 'enabled',
    };

    mount(props);

    // Card header
    cy.contains('COMPONENT NAME').should('be.visible');
    cy.contains('COMPONENT DESCRIPTION').should('be.visible');
    cy.contains('v1.2.3').should('be.visible');
    cy.contains('not installed').should('not.exist');
    cy.get('img').should('have.attr', 'src', '/logo.png');

    // Card content
    cy.get('[data-cy="kpi-container"]').should('be.visible');
    cy.get('[data-cy="uninstalled-container"]').should('not.exist');

    // Card is interactive and calls navigate on click
    cy.get('ui5-card').click();
    cy.get('@onNavigate').should('have.been.calledOnce');
    cy.get('@onInstall').should('not.have.been.called');
  });

  it('renders an uninstalled component', () => {
    const props: ComponentCardProps = {
      name: 'COMPONENT NAME',
      description: 'COMPONENT DESCRIPTION',
      logoImgSrc: '/logo.png',
      isInstalled: false,
      version: undefined,
      onNavigateToComponentSection: cy.stub().as('onNavigate'),
      onInstallButtonClick: cy.stub().as('onInstall'),
      kpiType: 'enabled',
    };

    mount(props);

    // Card header
    cy.contains('COMPONENT NAME').should('be.visible');
    cy.contains('COMPONENT DESCRIPTION').should('be.visible');
    cy.contains('not installed').should('be.visible');
    cy.get('img').should('have.attr', 'src', '/logo.png');

    // Card content
    cy.get('[data-cy="kpi-container"]').should('not.exist');
    cy.get('[data-cy="uninstalled-container"]').should('be.visible');

    // Card is not interactive and does not call navigate on click
    cy.get('ui5-card').click();
    cy.get('@onNavigate').should('not.have.been.called');
    cy.get('@onInstall').should('not.have.been.called');

    // Install button is visible and interactive
    cy.get('[data-cy="install-button"]').click();
    cy.get('@onNavigate').should('not.have.been.called');
    cy.get('@onInstall').should('have.been.called');
  });
});
