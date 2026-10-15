import { ComponentCardV2, ComponentCardV2Props, ComponentCardV2Status, InstancePhase } from './ComponentCardV2';

describe('ComponentCardV2', () => {
  const mount = (props: ComponentCardV2Props) => {
    cy.mount(<ComponentCardV2 {...props} />, {});
  };

  const installedStatus = (overrides: Partial<Extract<ComponentCardV2Status, { kind: 'installed' }>> = {}) =>
    ({
      kind: 'installed',
      phase: InstancePhase.Ready,
      conditions: [],
      isLoading: false,
      hasError: false,
      ...overrides,
    }) satisfies ComponentCardV2Status;

  it('renders an installed component and calls onNavigateToComponentSection on click', () => {
    const props: ComponentCardV2Props = {
      name: 'COMPONENT NAME',
      description: 'COMPONENT DESCRIPTION',
      logoImgSrc: '/logo.png',
      status: installedStatus(),
      version: '1.2.3',
      onNavigateToComponentSection: cy.stub().as('onNavigate'),
      onInstallButtonClick: cy.stub().as('onInstall'),
    };

    mount(props);

    cy.contains('COMPONENT NAME').should('be.visible');
    cy.contains('COMPONENT DESCRIPTION').should('be.visible');
    cy.contains('v1.2.3').should('be.visible');
    cy.get('[data-cy="kpi-container"]').should('be.visible');
    cy.get('[data-cy="uninstalled-container"]').should('not.exist');
    cy.get('[data-cy="component-health-button"]').should('be.visible');

    cy.get('ui5-card').click();
    cy.get('@onNavigate').should('have.been.calledOnce');
    cy.get('@onInstall').should('not.have.been.called');
  });

  it('renders an uninstalled component and calls onInstallButtonClick without navigating', () => {
    const props: ComponentCardV2Props = {
      name: 'COMPONENT NAME',
      description: 'COMPONENT DESCRIPTION',
      logoImgSrc: '/logo.png',
      status: { kind: 'uninstalled' },
      onNavigateToComponentSection: cy.stub().as('onNavigate'),
      onInstallButtonClick: cy.stub().as('onInstall'),
    };

    mount(props);

    cy.contains('not installed').should('be.visible');
    cy.get('[data-cy="kpi-container"]').should('not.exist');
    cy.get('[data-cy="uninstalled-container"]').should('be.visible');

    cy.get('ui5-card').click();
    cy.get('@onNavigate').should('not.have.been.called');

    cy.get('[data-cy="install-button"]').click();
    cy.get('@onInstall').should('have.been.called');
    cy.get('@onNavigate').should('not.have.been.called');
  });

  it('renders the yamlViewButton slot when installed and clicking it does not navigate or open the overflow menu', () => {
    const props: ComponentCardV2Props = {
      name: 'COMPONENT NAME',
      description: 'COMPONENT DESCRIPTION',
      logoImgSrc: '/logo.png',
      status: installedStatus(),
      version: '1.2.3',
      onNavigateToComponentSection: cy.stub().as('onNavigate'),
      onEditButtonClick: cy.stub().as('onEdit'),
      onDeleteButtonClick: cy.stub().as('onDelete'),
      yamlViewButton: <button data-cy="mock-yaml-button" type="button" onClick={cy.stub().as('onYamlClick')} />,
    };

    mount(props);

    cy.get('[data-cy="yaml-view-button"]').should('be.visible');
    cy.get('[data-cy="mock-yaml-button"]').click();

    cy.get('@onYamlClick').should('have.been.calledOnce');
    cy.get('@onNavigate').should('not.have.been.called');
    // The menu item is always mounted once onEditButtonClick is provided - only the enclosing
    // ui5-menu's open state (not DOM presence) reflects whether the overflow menu is showing.
    cy.get('[data-cy="edit-menu-item"]').should('not.be.visible');
  });

  it('does not render the yamlViewButton slot when the component is not installed', () => {
    const props: ComponentCardV2Props = {
      name: 'COMPONENT NAME',
      description: 'COMPONENT DESCRIPTION',
      logoImgSrc: '/logo.png',
      status: { kind: 'uninstalled' },
      onInstallButtonClick: cy.stub().as('onInstall'),
      yamlViewButton: <button data-cy="mock-yaml-button" type="button" />,
    };

    mount(props);

    cy.get('[data-cy="yaml-view-button"]').should('not.exist');
    cy.get('[data-cy="mock-yaml-button"]').should('not.exist');
  });

  it('renders an actions menu when installed and onEditButtonClick is provided', () => {
    const props: ComponentCardV2Props = {
      name: 'COMPONENT NAME',
      description: 'COMPONENT DESCRIPTION',
      logoImgSrc: '/logo.png',
      status: installedStatus(),
      version: '1.2.3',
      onNavigateToComponentSection: cy.stub().as('onNavigate'),
      onEditButtonClick: cy.stub().as('onEdit'),
    };

    mount(props);

    cy.get('[data-cy="actions-menu-button"]').click();
    cy.get('[data-cy="edit-menu-item"]').click();
    cy.get('@onEdit').should('have.been.calledOnce');
    cy.get('@onNavigate').should('not.have.been.called');
  });

  it('does not render an actions menu button when no action callbacks and no yamlViewButton are provided', () => {
    const props: ComponentCardV2Props = {
      name: 'COMPONENT NAME',
      description: 'COMPONENT DESCRIPTION',
      logoImgSrc: '/logo.png',
      status: installedStatus(),
      version: '1.2.3',
    };

    mount(props);

    cy.get('[data-cy="actions-menu-button"]').should('not.exist');
  });
});
