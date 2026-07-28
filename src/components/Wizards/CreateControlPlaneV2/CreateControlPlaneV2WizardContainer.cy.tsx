import '@ui5/webcomponents-cypress-commands';
import { useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { ManagedControlPlaneV2 } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { useCreateControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useCreateControlPlaneV2GraphQL.ts';
import { useUpdateControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useUpdateControlPlaneV2GraphQL.ts';
import type { McpV2Input } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { CreateControlPlaneV2WizardContainer } from './CreateControlPlaneV2WizardContainer.tsx';

describe('CreateManagedControlPlaneV2WizardContainer', () => {
  let createPayload: McpV2Input | null = null;
  let updatePayload: McpV2Input | null = null;

  const mockMutationResult = (input: McpV2Input) => ({
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

  const fakeUseCreateMcp: typeof useCreateControlPlaneV2GraphQL = () => ({
    createMcp: async (input: McpV2Input) => {
      createPayload = input;
      return mockMutationResult(input);
    },
    loading: false,
    error: undefined,
  });

  const fakeUseUpdateMcp: typeof useUpdateControlPlaneV2GraphQL = () => ({
    updateMcp: async (input: McpV2Input) => {
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
      <CreateControlPlaneV2WizardContainer
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
      <CreateControlPlaneV2WizardContainer
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

  const existingMcp: ManagedControlPlaneV2 = {
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
      <CreateControlPlaneV2WizardContainer
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
      <CreateControlPlaneV2WizardContainer
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
      <CreateControlPlaneV2WizardContainer
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
      <CreateControlPlaneV2WizardContainer
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
    const fakeFailingUpdate: typeof useUpdateControlPlaneV2GraphQL = () => ({
      updateMcp: async () => {
        throw new Error('Network error');
      },
      loading: false,
      error: undefined,
    });

    cy.mount(
      <CreateControlPlaneV2WizardContainer
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

  // ── Custom identity providers ────────────────────────────────────────────

  const existingMcpWithExtraProvider: ManagedControlPlaneV2 = {
    metadata: {
      name: 'existing-mcp-with-idp',
      namespace: 'project-my-project--ws-my-workspace',
      creationTimestamp: '2024-01-01T00:00:00Z',
      annotations: {
        'openmcp.cloud/display-name': 'Existing MCP with custom IdP',
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
            ],
          },
          extraProviders: [
            {
              name: 'custom',
              issuer: 'https://openmcp.accounts.ondemand.com',
              clientID: 'client-id-1',
              usernameClaim: 'email',
              usernamePrefix: null,
              groupsClaim: null,
              groupsPrefix: null,
              extraScopes: null,
              roleBindings: [
                {
                  roleRefs: [{ kind: 'ClusterRole', name: 'cluster-admin', namespace: null }],
                  subjects: [{ kind: 'User', name: 'custom:bob@example.com', apiGroup: null, namespace: null }],
                },
              ],
            },
          ],
        },
        tokens: null,
      },
    },
    status: null,
  };

  it('pre-fills extra-provider members from initialData in edit mode (regression: previously dropped)', () => {
    cy.mount(
      <CreateControlPlaneV2WizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        isEditMode={true}
        initialData={existingMcpWithExtraProvider}
        useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
        useUpdateManagedControlPlaneV2GraphQL={fakeUseUpdateMcp}
        useAuthOnboarding={fakeUseAuthOnboarding}
      />,
    );

    cy.get('ui5-button').contains('Next').click(); // metadata → members

    cy.contains('admin@example.com').should('exist');
    cy.contains('custom').should('exist');
    cy.contains('bob@example.com').should('exist');
  });

  it('includes extraProviders in the update payload on submit (regression: previously dropped)', () => {
    cy.mount(
      <CreateControlPlaneV2WizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        isEditMode={true}
        initialData={existingMcpWithExtraProvider}
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
      cy.wrap(updatePayload!.extraProviders).should('have.length', 1);
      cy.wrap(updatePayload!.extraProviders[0].name).should('eq', 'custom');
      cy.wrap(updatePayload!.extraProviders[0].roleBindings).should('have.length', 1);
      cy.wrap(updatePayload!.extraProviders[0].roleBindings[0].subjects[0].name).should('eq', 'bob@example.com');
    });
  });

  it('default-provider checkbox is locked (disabled) when there are zero extra providers', () => {
    cy.mount(
      <CreateControlPlaneV2WizardContainer
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

    cy.get('[data-testid="default-provider-enabled-checkbox"]').should('have.attr', 'disabled');
  });

  it('adding a new identity provider via the wizard includes it in the create payload', () => {
    cy.mount(
      <CreateControlPlaneV2WizardContainer
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

    cy.get('[data-testid="add-provider-button"]').click();
    cy.get('ui5-dialog[open]').should('exist');
    cy.get('[data-testid="provider-name-input"]').typeIntoUi5Input('custom');
    cy.get('[data-testid="provider-issuer-input"]').typeIntoUi5Input('https://example.com');
    cy.get('[data-testid="provider-client-id-input"]').typeIntoUi5Input('client-id-1');
    cy.get('ui5-dialog[open]').contains('ui5-button', 'Add Identity Provider').click();

    cy.contains('custom').should('exist');

    cy.get('ui5-button').contains('Next').click(); // members → summarize
    cy.get('ui5-button').contains('Create').click();

    cy.then(() => {
      cy.wrap(createPayload).should('not.be.null');
      cy.wrap(createPayload!.extraProviders).should('have.length', 1);
      cy.wrap(createPayload!.extraProviders[0].name).should('eq', 'custom');
      cy.wrap(createPayload!.extraProviders[0].issuer).should('eq', 'https://example.com');
    });
  });

  it('deleting a provider with members shows a cascade-delete confirmation and removes both on confirm', () => {
    cy.mount(
      <CreateControlPlaneV2WizardContainer
        isOpen={true}
        setIsOpen={() => {}}
        isEditMode={true}
        initialData={existingMcpWithExtraProvider}
        useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
        useUpdateManagedControlPlaneV2GraphQL={fakeUseUpdateMcp}
        useAuthOnboarding={fakeUseAuthOnboarding}
      />,
    );

    cy.get('ui5-button').contains('Next').click(); // metadata → members

    cy.contains('custom').should('exist');
    cy.contains('bob@example.com').should('exist');

    cy.get('[data-testid="confirm-delete-provider-button"]').should('not.exist');
    cy.get('[data-testid="delete-provider-custom"]').click();
    cy.contains('Its 1 member will also be removed').should('exist');
    cy.get('[data-testid="confirm-delete-provider-button"]').click();

    cy.contains('custom').should('not.exist');
    cy.contains('bob@example.com').should('not.exist');
  });
});
