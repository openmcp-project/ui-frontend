import { CreateGitRepositoryDialog } from './CreateGitRepositoryDialog';
import { CreateGitRepositoryParams } from '../../hooks/useCreateGitRepository';

describe('CreateGitRepositoryDialog', () => {
  let capturedData: CreateGitRepositoryParams | null = null;

  const fakeUseCreateGitRepository = () => ({
    createGitRepository: async (data: CreateGitRepositoryParams): Promise<void> => {
      capturedData = data;
    },
    isLoading: false,
  });

  beforeEach(() => {
    capturedData = null;
  });

  it('creates a git repository with valid data', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateGitRepositoryDialog
        isOpen={true}
        namespace="default"
        useCreateGitRepository={fakeUseCreateGitRepository}
        onClose={onClose}
      />,
    );

    const expectedPayload = {
      namespace: 'default',
      name: 'test-repo',
      interval: '5m0s',
      url: 'https://github.com/test/repo',
      branch: 'develop',
      secretRef: '',
    };

    // Fill in the form
    cy.get('#name').find('input').type('test-repo');
    cy.get('#interval').find('input').clear().type('5m0s');
    cy.get('#url').find('input').type('https://github.com/test/repo');
    cy.get('#branch').find('input').clear().type('develop');

    // Submit the form
    cy.get('ui5-button').contains('Create').click();

    // Verify the hook was called with correct data
    cy.then(() => cy.wrap(capturedData).deepEqualJson(expectedPayload));

    // Dialog should close on success
    cy.wrap(onClose).should('have.been.called');
  });

  it('includes secretRef when provided', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateGitRepositoryDialog
        isOpen={true}
        namespace="default"
        useCreateGitRepository={fakeUseCreateGitRepository}
        onClose={onClose}
      />,
    );

    const expectedPayload = {
      namespace: 'default',
      name: 'test-repo',
      interval: '1m0s',
      url: 'https://github.com/test/repo',
      branch: 'main',
      secretRef: 'my-git-secret',
    };

    // Fill in the form
    cy.get('#name').find('input').type('test-repo');
    cy.get('#url').find('input').type('https://github.com/test/repo');
    cy.get('#secretRef').find('input').type('my-git-secret');

    // Submit the form
    cy.get('ui5-button').contains('Create').click();

    // Verify the hook was called with correct data
    cy.then(() => cy.wrap(capturedData).deepEqualJson(expectedPayload));

    // Dialog should close on success
    cy.wrap(onClose).should('have.been.called');
  });

  it('validates required fields', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateGitRepositoryDialog
        isOpen={true}
        namespace="default"
        useCreateGitRepository={fakeUseCreateGitRepository}
        onClose={onClose}
      />,
    );

    // Try to submit without filling required fields
    cy.get('ui5-button').contains('Create').click();

    // Should show validation errors
    cy.get('#name').should('have.attr', 'value-state', 'Negative');
    cy.contains('This field is required').should('exist');

    // Dialog should not close
    cy.wrap(onClose).should('not.have.been.called');
  });

  it('validates URL format', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateGitRepositoryDialog
        isOpen={true}
        namespace="default"
        useCreateGitRepository={fakeUseCreateGitRepository}
        onClose={onClose}
      />,
    );

    cy.get('#name').find('input').type('test-repo');
    cy.get('#interval').find('input').clear().type('1m0s');
    cy.get('#branch').find('input').clear().type('main');

    // Test 1: Invalid string
    cy.get('#url').find('input').clear().type('not-a-valid-url');
    cy.get('ui5-button').contains('Create').click();
    cy.get('#url').should('have.attr', 'value-state', 'Negative');
    cy.contains('Must be a valid HTTPS URL').should('exist');

    // Test 2: HTTP protocol (should fail if we require HTTPS)
    cy.get('#url').find('input').clear().type('http://github.com/test/repo');
    cy.get('ui5-button').contains('Create').click();
    cy.get('#url').should('have.attr', 'value-state', 'Negative');
    cy.contains('Must be a valid HTTPS URL').should('exist');

    // Test 3: Valid HTTPS URL (should pass)
    cy.get('#url').find('input').clear().type('https://github.com/test/repo');
    cy.get('ui5-button').contains('Create').click();

    // Dialog should close on success
    cy.wrap(onClose).should('have.been.called');
  });

  it('closes dialog when cancel is clicked', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateGitRepositoryDialog
        isOpen={true}
        namespace="default"
        useCreateGitRepository={fakeUseCreateGitRepository}
        onClose={onClose}
      />,
    );

    // Fill in some data
    cy.get('#name').find('input').type('test-repo');

    // Click cancel
    cy.get('ui5-button').contains('Cancel').click();

    // Dialog should close without calling onSuccess
    cy.wrap(onClose).should('have.been.called');
  });

  it('uses default values for interval and branch', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateGitRepositoryDialog
        isOpen={true}
        namespace="default"
        useCreateGitRepository={fakeUseCreateGitRepository}
        onClose={onClose}
      />,
    );

    // Check default values
    cy.get('#interval').find('input').should('have.value', '1m0s');
    cy.get('#branch').find('input').should('have.value', 'main');
  });

  it('should not close dialog when creation fails', () => {
    const failingUseCreateGitRepository = () => ({
      createGitRepository: async (): Promise<void> => {
        throw new Error('Creation failed');
      },
      isLoading: false,
    });

    const onClose = cy.stub();

    cy.mount(
      <CreateGitRepositoryDialog
        isOpen={true}
        namespace="default"
        useCreateGitRepository={failingUseCreateGitRepository}
        onClose={onClose}
      />,
    );

    // Fill in the form
    cy.get('#name').find('input').type('test-repo');
    cy.get('#interval').find('input').clear().type('1m0s');
    cy.get('#url').find('input').type('https://github.com/test/repo');
    cy.get('#branch').find('input').clear().type('main');

    // Submit the form
    cy.get('ui5-button').contains('Create').click();

    // Dialog should NOT close on failure
    cy.wrap(onClose).should('not.have.been.called');

    // Dialog should still be visible
    cy.contains('Create Git Repository').should('be.visible');
  });
});
