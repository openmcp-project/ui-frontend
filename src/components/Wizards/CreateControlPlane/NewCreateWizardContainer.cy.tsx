import '@ui5/webcomponents-cypress-commands';
import { useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { NewControlPlane } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { useCreateControlPlane } from '../../../spaces/control-plane/hooks/useCreateControlPlane.ts';
import { useUpdateControlPlane } from '../../../spaces/control-plane/hooks/useUpdateControlPlane.ts';
import type { NewControlPlaneInput } from '../../../spaces/mcp/schemas/ControlPlaneInput.schema.ts';
import { NewCreateWizardContainer } from './NewCreateWizardContainer.tsx';

describe('CreateManagedControlPlaneV2WizardContainer', () => {
  let createPayload: NewControlPlaneInput | null = null;
  let updatePayload: NewControlPlaneInput | null = null;

  const mockMutationResult = (input: NewControlPlaneInput) => ({
    metadata: {
      name: input.name,
      namespace: input.namespace,
    },
    status: {
      phase: 'Ready',
    },
  });

  const fakeUseAuthOnboarding = (() => ({
    user: { email: 'user@example.com' },
  })) as typeof useAuthOnboarding;

  const fakeUseCreateMcp: typeof useCreateControlPlane = () => ({
    createMcp: async (input: NewControlPlaneInput) => {
      createPayload = input;
      return mockMutationResult(input);
    },
    loading: false,
    error: undefined,
  });

  const fakeUseUpdateMcp: typeof useUpdateControlPlane = () => ({
    updateMcp: async (input: NewControlPlaneInput) => {
      updatePayload = input;
      return mockMutationResult(input);
    },
    loading: false,
    error: undefined,
  });

  before(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('module is not defined')) return false;
    });
  });

  beforeEach(() => {
    createPayload = null;
    updatePayload = null;
  });

  // ── Create mode ───────────────────────────────────────────────────────────

  it('creates a new MCP with name and default member', () => {
    cy.mount(
      <NewCreateWizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        projectName="my-project"
        workspaceName="my-workspace"
        useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
        useUpdateManagedControlPlaneV2GraphQL={fakeUseUpdateMcp}
        useAuthOnboarding={fakeUseAuthOnboarding}
      />,
    );

    cy.get('#name').typeIntoUi5Input('my-new-mcp');
    cy.get('ui5-button').contains('Next').click(); // metadata → members
    cy.get('ui5-button').contains('Next').click(); // members → summarize
    cy.get('ui5-button').contains('Create').click();

    cy.then(() => {
      cy.wrap(createPayload).should('not.be.null');
      cy.wrap(createPayload!.name).should('eq', 'my-new-mcp');
      cy.wrap(createPayload!.namespace).should('eq', 'my-project--ws-my-workspace');
    });
  });

  it('shows the success step after a successful create', () => {
    cy.mount(
      <NewCreateWizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        projectName="my-project"
        workspaceName="my-workspace"
        useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
        useUpdateManagedControlPlaneV2GraphQL={fakeUseUpdateMcp}
        useAuthOnboarding={fakeUseAuthOnboarding}
      />,
    );

    cy.get('#name').typeIntoUi5Input('my-new-mcp');
    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Create').click();

    cy.get('ui5-button').contains('Close').should('exist');
  });

  // ── Edit mode ─────────────────────────────────────────────────────────────

  const existingMcp: NewControlPlane = {
    metadata: {
      name: 'existing-mcp',
      namespace: 'project-my-project--ws-my-workspace',
      creationTimestamp: '2024-01-01T00:00:00Z',
      annotations: {
        'openmcp.cloud/display-name': 'Existing MCP',
      },
    },
    spec: {
      iam: {
        oidc: {
          defaultProvider: {
            roleBindings: [
              {
                roleRefs: [{ kind: 'ClusterRole', name: 'admin', namespace: null }],
                subjects: [{ kind: 'User', name: 'admin@example.com', apiGroup: null, namespace: null }],
              },
              {
                roleRefs: [{ kind: 'ClusterRole', name: 'view', namespace: null }],
                subjects: [{ kind: 'User', name: 'viewer@example.com', apiGroup: null, namespace: null }],
              },
            ],
          },
          extraProviders: null,
        },
        tokens: null,
      },
    },
    status: null,
  };

  it('pre-fills the name field from initialData in edit mode', () => {
    cy.mount(
      <NewCreateWizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        isEditMode={true}
        initialData={existingMcp}
        useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
        useUpdateManagedControlPlaneV2GraphQL={fakeUseUpdateMcp}
        useAuthOnboarding={fakeUseAuthOnboarding}
      />,
    );

    cy.get('#name').should('have.value', 'existing-mcp');
  });

  it('pre-fills members from initialData roleBindings in edit mode', () => {
    cy.mount(
      <NewCreateWizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        isEditMode={true}
        initialData={existingMcp}
        useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
        useUpdateManagedControlPlaneV2GraphQL={fakeUseUpdateMcp}
        useAuthOnboarding={fakeUseAuthOnboarding}
      />,
    );

    // navigate to members step
    cy.get('ui5-button').contains('Next').click();

    cy.contains('admin@example.com').should('exist');
    cy.contains('viewer@example.com').should('exist');
  });

  it('calls updateMcp with correct payload on submit in edit mode', () => {
    cy.mount(
      <NewCreateWizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        isEditMode={true}
        initialData={existingMcp}
        useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
        useUpdateManagedControlPlaneV2GraphQL={fakeUseUpdateMcp}
        useAuthOnboarding={fakeUseAuthOnboarding}
      />,
    );

    cy.get('ui5-button').contains('Next').click(); // metadata → members
    cy.get('ui5-button').contains('Next').click(); // members → summarize
    cy.get('ui5-button').contains('Update').click();

    cy.then(() => {
      cy.wrap(updatePayload).should('not.be.null');
      cy.wrap(updatePayload!.name).should('eq', 'existing-mcp');
      cy.wrap(updatePayload!.namespace).should('eq', 'project-my-project--ws-my-workspace');
      // two role bindings — admin and view
      cy.wrap(updatePayload!.roleBindings).should('have.length', 2);
    });
    cy.then(() => cy.wrap(createPayload).should('be.null'));
  });

  it('shows the success step after a successful update in edit mode', () => {
    cy.mount(
      <NewCreateWizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        isEditMode={true}
        initialData={existingMcp}
        useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
        useUpdateManagedControlPlaneV2GraphQL={fakeUseUpdateMcp}
        useAuthOnboarding={fakeUseAuthOnboarding}
      />,
    );

    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Update').click();

    cy.get('ui5-button').contains('Close').should('exist');
  });

  it('shows an error dialog when updateMcp throws in edit mode', () => {
    const fakeFailingUpdate: typeof useUpdateControlPlane = () => ({
      updateMcp: async () => {
        throw new Error('Network error');
      },
      loading: false,
      error: undefined,
    });

    cy.mount(
      <NewCreateWizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        isEditMode={true}
        initialData={existingMcp}
        useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
        useUpdateManagedControlPlaneV2GraphQL={fakeFailingUpdate}
        useAuthOnboarding={fakeUseAuthOnboarding}
      />,
    );

    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Update').click();

    // wizard should stay on summarize step and surface the backend error
    cy.contains('Network error').should('exist');
    cy.get('ui5-button').contains('Update').should('exist');
  });
});
