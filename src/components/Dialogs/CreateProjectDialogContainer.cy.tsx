import { CreateProjectDialogContainer } from './CreateProjectDialogContainer';
import { useCreateProject, CreateProjectParams } from '../../hooks/useCreateProject';
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

    // Fill in the form
    cy.get('#name').find('input[id*="inner"]').type('test-project');
    cy.get('#displayName').find('input[id*="inner"]').type('Test Project Display Name');

    // Select charging target type (should be pre-selected as 'btp')
    cy.get('#chargingTargetType').click();
    cy.contains('BTP').click();

    // Fill charging target
    cy.get('#chargingTarget').find('input[id*="inner"]').type('12345678-1234-1234-1234-123456789abc');

    // Submit the form
    cy.get('ui5-button').contains('Create').click();

    // Verify the hook was called with correct data
    cy.then(() => cy.wrap(createProjectPayload).deepEqualJson(expectedPayload));

    // Dialog should close on success
    cy.wrap(setIsOpen).should('have.been.calledWith', false);
  });

  it('validates required fields', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <CreateProjectDialogContainer
        useCreateProject={fakeUseCreateProject}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
      />,
    );

    // Try to submit without filling required fields
    cy.get('ui5-button').contains('Create').click();

    // Should show validation errors
    cy.get('#name').should('have.attr', 'value-state', 'Negative');
    cy.contains('This field is required').should('exist');

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

    // Invalid format
    cy.get('#chargingTarget').find('input[id*="inner"]').type('invalid-format');
    cy.get('ui5-button').contains('Create').click();

    // Should show validation error
    cy.get('#chargingTarget').should('have.attr', 'value-state', 'Negative');

    // Dialog should not close
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

    // Fill in the form
    cy.get('#name').find('input[id*="inner"]').type('test-project');
    cy.get('#chargingTargetType').click();
    cy.contains('BTP').click();
    cy.get('#chargingTarget').find('input[id*="inner"]').type('12345678-1234-1234-1234-123456789abc');

    // Submit the form
    cy.get('ui5-button').contains('Create').click();

    // Dialog should NOT close on failure
    cy.wrap(setIsOpen).should('not.have.been.called');

    // Dialog should still be visible
    cy.contains('Create').should('be.visible');
  });
});
