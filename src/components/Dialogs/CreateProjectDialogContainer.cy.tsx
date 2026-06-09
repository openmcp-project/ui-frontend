import { CreateProjectDialogContainer } from './CreateProjectDialogContainer';
import { useCreateProject, CreateProjectParams } from '../../spaces/onboarding/hooks/useCreateProject';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding';

describe('CreateProjectDialogContainer', () => {
  let createProjectPayload: CreateProjectParams | null = null;

  const fakeUseCreateProject: typeof useCreateProject = () => ({
    createProject: async (data: CreateProjectParams): Promise<void> => {
      createProjectPayload = data;
    },
    isLoading: false,
  });

  const fakeUseAuthOnboarding = (() => ({
    user: {
      email: 'name@domain.com',
    },
  })) as typeof useAuthOnboarding;

  beforeEach(() => {
    createProjectPayload = null;
  });

  const fillMetadata = () => {
    cy.get('#name').find('input[id*="inner"]').type('test-project');
    cy.get('#displayName').find('input[id*="inner"]').type('Test Project Display Name');
    cy.get('#chargingTargetType').click();
    cy.contains('BTP').click();
    cy.get('#chargingTarget').find('input[id*="inner"]').type('12345678-1234-1234-1234-123456789abc');
  };

  const goToMembers = () => {
    cy.get('ui5-button').contains('Next').click();
  };

  it('creates a project with valid data', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <CreateProjectDialogContainer
        useCreateProject={fakeUseCreateProject}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
      />,
    );

    const expectedPayload = {
      name: 'test-project',
      displayName: 'Test Project Display Name',
      chargingTarget: '12345678-1234-1234-1234-123456789abc',
      chargingTargetType: 'btp',
      members: [
        {
          name: 'name@domain.com',
          roles: ['admin'],
          kind: 'User',
        },
      ],
    };

    fillMetadata();
    goToMembers();

    cy.get('ui5-button').contains('Create').click();

    cy.then(() => cy.wrap(createProjectPayload).deepEqualJson(expectedPayload));
    cy.wrap(setIsOpen).should('have.been.calledWith', false);
  });

  it('validates required fields on metadata step', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <CreateProjectDialogContainer
        useCreateProject={fakeUseCreateProject}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
      />,
    );

    // Next is disabled until metadata is valid — button should be disabled
    cy.get('ui5-button').contains('Next').should('have.attr', 'disabled');

    // Should show validation state on name field
    cy.get('#name').should('have.attr', 'value-state', 'None');

    // Dialog should not close
    cy.wrap(setIsOpen).should('not.have.been.called');
  });

  it('validates charging target format for BTP', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <CreateProjectDialogContainer
        useCreateProject={fakeUseCreateProject}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
      />,
    );

    cy.get('#name').find('input[id*="inner"]').type('test-project');
    cy.get('#chargingTargetType').click();
    cy.contains('BTP').click();

    // Invalid format — Next should remain disabled
    cy.get('#chargingTarget').find('input[id*="inner"]').type('invalid-format');
    cy.get('ui5-button').contains('Next').should('have.attr', 'disabled');

    // Should show validation error
    cy.get('#chargingTarget').should('have.attr', 'value-state', 'Negative');

    cy.wrap(setIsOpen).should('not.have.been.called');
  });

  it('should not close dialog when creation fails', () => {
    const failingUseCreateProject: typeof useCreateProject = () => ({
      createProject: async (): Promise<void> => {
        throw new Error('Creation failed');
      },
      isLoading: false,
    });

    const setIsOpen = cy.stub();

    cy.mount(
      <CreateProjectDialogContainer
        useCreateProject={failingUseCreateProject}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
      />,
    );

    cy.get('#name').find('input[id*="inner"]').type('test-project');
    cy.get('#chargingTargetType').click();
    cy.contains('BTP').click();
    cy.get('#chargingTarget').find('input[id*="inner"]').type('12345678-1234-1234-1234-123456789abc');

    goToMembers();
    cy.get('ui5-button').contains('Create').click();

    cy.wrap(setIsOpen).should('not.have.been.called');

    cy.contains('Error').should('be.visible');
    cy.contains('Creation failed').should('be.visible');
  });
});
