import { CreateWorkspaceDialogContainer } from './CreateWorkspaceDialogContainer';
import { useCreateWorkspace, CreateWorkspaceParams } from '../../hooks/useCreateWorkspace';
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

  it('creates a workspace with valid data', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <CreateWorkspaceDialogContainer
        useCreateWorkspace={fakeUseCreateWorkspace}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
        project="test-project"
      />,
    );

    const expectedPayload = {
      name: 'test-workspace',
      displayName: 'Test Workspace Display Name',
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

    // Fill in the form (using Shadow DOM selectors)
    cy.get('#name').find('input[id*="inner"]').type('test-workspace');
    cy.get('#displayName').find('input[id*="inner"]').type('Test Workspace Display Name');

    // Select charging target type
    cy.get('#chargingTargetType').click();
    cy.contains('BTP').click();

    // Fill charging target
    cy.get('#chargingTarget').find('input[id*="inner"]').type('12345678-1234-1234-1234-123456789abc');

    // Submit the form
    cy.get('ui5-button').contains('Create').click();

    // Verify the hook was called with correct data
    cy.then(() => cy.wrap(createWorkspacePayload).deepEqualJson(expectedPayload));

    // Dialog should close on success
    cy.wrap(setIsOpen).should('have.been.calledWith', false);
  });

  it('validates required fields', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <CreateWorkspaceDialogContainer
        useCreateWorkspace={fakeUseCreateWorkspace}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
        project="test-project"
      />,
    );

    // Try to submit without filling required fields
    cy.get('ui5-button').contains('Create').click();

    // Should show validation errors - check for value-state="Negative" attribute
    cy.get('#name').should('have.attr', 'value-state', 'Negative');

    // Or check if error message exists in DOM (even if hidden by CSS)
    cy.contains('This field is required').should('exist');

    // Dialog should not close
    cy.wrap(setIsOpen).should('not.have.been.called');
  });

  it('validates charging target format for BTP', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <CreateWorkspaceDialogContainer
        useCreateWorkspace={fakeUseCreateWorkspace}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
        project="test-project"
      />,
    );

    cy.get('#name').find('input[id*="inner"]').type('test-workspace');
    cy.get('#chargingTargetType').click();
    cy.contains('BTP').click();

    // Invalid format
    cy.get('#chargingTarget').find('input[id*="inner"]').type('invalid-format');
    cy.get('ui5-button').contains('Create').click();

    // Should show validation error - check for value-state="Negative" attribute
    cy.get('#chargingTarget').should('have.attr', 'value-state', 'Negative');

    // Dialog should not close
    cy.wrap(setIsOpen).should('not.have.been.called');
  });

  it('should not close dialog when creation fails', () => {
    const failingUseCreateWorkspace: typeof useCreateWorkspace = () => ({
      createWorkspace: async (): Promise<void> => {
        throw new Error('Creation failed'); // Simulate failure by throwing error
      },
      isLoading: false,
    });

    const setIsOpen = cy.stub();

    cy.mount(
      <CreateWorkspaceDialogContainer
        useCreateWorkspace={failingUseCreateWorkspace}
        useAuthOnboarding={fakeUseAuthOnboarding}
        isOpen={true}
        setIsOpen={setIsOpen}
        project="test-project"
      />,
    );

    // Fill in the form
    cy.get('#name').find('input[id*="inner"]').type('test-workspace');
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
