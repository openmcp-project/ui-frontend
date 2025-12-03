import { CreateKustomizationDialog } from './CreateKustomizationDialog';
import { CreateKustomizationParams } from '../../hooks/useCreateKustomization';

describe('CreateKustomizationDialog', () => {
  let capturedData: CreateKustomizationParams | null = null;

  const fakeUseCreateKustomization = () => ({
    createKustomization: async (data: CreateKustomizationParams): Promise<void> => {
      capturedData = data;
    },
    isLoading: false,
  });

  beforeEach(() => {
    capturedData = null;
  });

  it('creates a kustomization with valid data', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateKustomizationDialog isOpen={true} useCreateKustomization={fakeUseCreateKustomization} onClose={onClose} />,
    );

    const expectedPayload = {
      namespace: 'default',
      name: 'test-kustomization',
      interval: '5m0s',
      sourceRefName: 'test-repo',
      path: './deploy',
      prune: true,
      targetNamespace: '',
      substitutions: [],
    };

    // Fill in the form
    cy.get('[name="name"]').typeIntoUi5Input('test-kustomization');
    cy.get('[name="interval"]').find('input').clear().type('5m0s');
    cy.get('[name="sourceRefName"]').typeIntoUi5Input('test-repo');
    cy.get('[name="path"]').find('input').clear().type('./deploy');

    // Submit the form
    cy.get('ui5-button').contains('Create').click();

    // Verify the hook was called with correct data
    cy.then(() => cy.wrap(capturedData).deepEqualJson(expectedPayload));

    // Dialog should close on success
    cy.wrap(onClose).should('have.been.called');
  });

  it('includes substitutions when provided', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateKustomizationDialog isOpen={true} useCreateKustomization={fakeUseCreateKustomization} onClose={onClose} />,
    );

    const expectedPayload = {
      namespace: 'default',
      name: 'test-kustomization',
      interval: '1m0s',
      sourceRefName: 'test-repo',
      path: './',
      prune: true,
      targetNamespace: '',
      substitutions: [{ key: 'key1', value: 'value1' }],
    };

    // Fill in the form
    cy.get('[name="name"]').typeIntoUi5Input('test-kustomization');
    cy.get('[name="sourceRefName"]').typeIntoUi5Input('test-repo');

    // Add substitution
    cy.get('ui5-button').contains('Add Substitution').click();
    cy.get('[name="substitutions.0.key"]').typeIntoUi5Input('key1');
    cy.get('[name="substitutions.0.value"]').typeIntoUi5Input('value1');

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
      <CreateKustomizationDialog isOpen={true} useCreateKustomization={fakeUseCreateKustomization} onClose={onClose} />,
    );

    // Try to submit without filling required fields
    cy.get('ui5-button').contains('Create').click();

    // Should show validation errors
    cy.get('[name="name"]').should('have.attr', 'value-state', 'Negative');
    cy.contains('This field is required').should('exist');
    cy.get('[name="sourceRefName"]').should('have.attr', 'value-state', 'Negative');

    // Dialog should not close
    cy.wrap(onClose).should('not.have.been.called');
  });

  it('closes dialog when cancel is clicked', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateKustomizationDialog isOpen={true} useCreateKustomization={fakeUseCreateKustomization} onClose={onClose} />,
    );

    // Fill in some data
    cy.get('[name="name"]').typeIntoUi5Input('test-kustomization');

    // Click cancel
    cy.get('ui5-button').contains('Cancel').click();

    // Dialog should close without calling onSuccess
    cy.wrap(onClose).should('have.been.called');
  });

  it('uses default values for interval and prune', () => {
    const onClose = cy.stub();

    cy.mount(
      <CreateKustomizationDialog isOpen={true} useCreateKustomization={fakeUseCreateKustomization} onClose={onClose} />,
    );

    // Check default values
    cy.get('[name="interval"]').find('input').should('have.value', '1m0s');
    cy.get('[name="path"]').find('input').should('have.value', './');
    cy.get('[name="prune"]').should('have.attr', 'checked');
  });

  it('should not close dialog when creation fails', () => {
    const failingUseCreateKustomization = () => ({
      createKustomization: async (): Promise<void> => {
        throw new Error('Creation failed');
      },
      isLoading: false,
    });

    const onClose = cy.stub();

    cy.mount(
      <CreateKustomizationDialog
        isOpen={true}
        useCreateKustomization={failingUseCreateKustomization}
        onClose={onClose}
      />,
    );

    // Fill in the form
    cy.get('[name="name"]').typeIntoUi5Input('test-kustomization');
    cy.get('[name="sourceRefName"]').typeIntoUi5Input('test-repo');

    // Submit the form
    cy.get('ui5-button').contains('Create').click();

    // Dialog should NOT close on failure
    cy.wrap(onClose).should('not.have.been.called');

    // Dialog should still be visible
    cy.contains('Create Kustomization').should('be.visible');
  });
});
