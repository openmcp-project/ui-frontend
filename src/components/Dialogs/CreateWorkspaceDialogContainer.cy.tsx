import { CreateWorkspaceDialogContainer } from './CreateWorkspaceDialogContainer';
import { useCreateWorkspace, CreateWorkspaceParams } from '../../spaces/onboarding/hooks/useCreateWorkspace';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding';

describe('CreateWorkspaceDialogContainer', () => {
  let createWorkspacePayload: CreateWorkspaceParams | null = null;

  const fakeUseCreateWorkspace: typeof useCreateWorkspace = () => ({
    createWorkspace: async (data: CreateWorkspaceParams): Promise<void> => {
      createWorkspacePayload = data;
    },
    isLoading: false,
  });

  const fakeUseAuthOnboarding = (() => ({
    user: {
      email: 'name@domain.com',
    },
  })) as typeof useAuthOnboarding;

  beforeEach(() => {
    createWorkspacePayload = null;
  });

  const mountWorkspace = (setIsOpen: ReturnType<typeof cy.stub>, useCreateWorkspace = fakeUseCreateWorkspace) => {
    cy.mount(
      <CreateWorkspaceDialogContainer
        useCreateWorkspace={useCreateWorkspace}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
        project="test-project"
      />,
    );
  };

  const goToMembers = () => cy.get('ui5-button').contains('Next').click();

  it('creates a workspace with valid data', () => {
    const setIsOpen = cy.stub();
    mountWorkspace(setIsOpen);

    const expectedPayload = {
      name: 'test-workspace',
      displayName: 'Test Workspace Display Name',
      chargingTarget: '12345678-1234-1234-1234-123456789abc',
      chargingTargetType: 'btp',
      members: [{ name: 'name@domain.com', roles: ['admin'], kind: 'User' }],
    };

    cy.get('#name').typeIntoUi5Input('test-workspace');
    cy.get('#displayName').typeIntoUi5Input('Test Workspace Display Name');
    cy.get('#chargingTargetType').openDropDownByClick();
    cy.get('#chargingTargetType').clickDropdownMenuItemByText<Cypress.TriggerOptions>('BTP');
    cy.get('#chargingTarget').typeIntoUi5Input('12345678-1234-1234-1234-123456789abc').type('{enter}');

    goToMembers();
    cy.get('ui5-button').contains('Create').click();

    cy.then(() => cy.wrap(createWorkspacePayload).deepEqualJson(expectedPayload));
    cy.wrap(setIsOpen).should('have.been.calledWith', false);
  });

  it('validates required fields on metadata step', () => {
    const setIsOpen = cy.stub();
    mountWorkspace(setIsOpen);

    // Next is disabled until metadata is valid
    cy.get('ui5-button').contains('Next').should('have.attr', 'disabled');
    cy.wrap(setIsOpen).should('not.have.been.called');
  });

  it('validates charging target format for BTP', () => {
    const setIsOpen = cy.stub();
    mountWorkspace(setIsOpen);

    cy.get('#name').typeIntoUi5Input('test-workspace');
    cy.get('#chargingTargetType').openDropDownByClick();
    cy.get('#chargingTargetType').clickDropdownMenuItemByText<Cypress.TriggerOptions>('BTP');

    cy.get('#chargingTarget').should('not.have.attr', 'disabled');
    cy.get('#chargingTarget').typeIntoUi5Input('invalid-format').type('{enter}');
    cy.get('ui5-button').contains('Next').should('have.attr', 'disabled');
    cy.get('#chargingTarget').should('have.attr', 'value-state', 'Negative');
    cy.wrap(setIsOpen).should('not.have.been.called');
  });

  it('should not close dialog when creation fails', () => {
    const failingUseCreateWorkspace: typeof useCreateWorkspace = () => ({
      createWorkspace: async (): Promise<void> => {
        throw new Error('Creation failed');
      },
      isLoading: false,
    });

    const setIsOpen = cy.stub();
    mountWorkspace(setIsOpen, failingUseCreateWorkspace);

    cy.get('#name').typeIntoUi5Input('test-workspace');
    cy.get('#chargingTargetType').openDropDownByClick();
    cy.get('#chargingTargetType').clickDropdownMenuItemByText<Cypress.TriggerOptions>('BTP');
    cy.get('#chargingTarget').should('not.have.attr', 'disabled');
    cy.get('#chargingTarget').typeIntoUi5Input('12345678-1234-1234-1234-123456789abc').type('{enter}');

    goToMembers();
    cy.get('ui5-button').contains('Create').click();

    cy.wrap(setIsOpen).should('not.have.been.called');
    cy.contains('Error').should('be.visible');
    cy.contains('Creation failed').should('be.visible');
  });
});
