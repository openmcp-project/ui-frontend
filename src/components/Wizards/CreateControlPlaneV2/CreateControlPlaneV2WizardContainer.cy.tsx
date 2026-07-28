import '@ui5/webcomponents-cypress-commands';
import type { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { ManagedControlPlaneV2 } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { useCreateControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useCreateControlPlaneV2GraphQL.ts';
import { useUpdateControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useUpdateControlPlaneV2GraphQL.ts';
import type { McpV2Input } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { useUpdateCrossplane } from '../../../spaces/mcp/hooks/useUpdateCrossplane.ts';
import { useCreateFlux } from '../../../spaces/mcp/hooks/useCreateFlux.ts';
import { useDeleteFlux } from '../../../spaces/mcp/hooks/useDeleteFlux.ts';
import { useCreateLandscaper } from '../../../spaces/mcp/hooks/useCreateLandscaper.ts';
import { useUpdateLandscaper } from '../../../spaces/mcp/hooks/useUpdateLandscaper.ts';
import { useCreateEso } from '../../../spaces/mcp/hooks/useCreateEso.ts';
import { useDeleteEso } from '../../../spaces/mcp/hooks/useDeleteEso.ts';
import {
  GetCrossplaneDocument,
  GetFluxDocument,
  GetLandscaperDocument,
  GetExternalSecretsOperatorDocument,
} from '../../../types/__generated__/graphql/graphql.ts';
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

  const mountWizard = (
    props: Partial<React.ComponentProps<typeof CreateControlPlaneV2WizardContainer>> = {},
    mocks: readonly MockedResponse[] = [],
  ) => {
    cy.mount(
      <MockedProvider mocks={mocks}>
        <CreateControlPlaneV2WizardContainer
          isOpen={true}
          setIsOpen={() => {}}
          projectName="my-project"
          workspaceName="my-workspace"
          useCreateManagedControlPlaneV2GraphQL={fakeUseCreateMcp}
          useUpdateManagedControlPlaneV2GraphQL={fakeUseUpdateMcp}
          useAuthOnboarding={fakeUseAuthOnboarding}
          {...props}
        />
      </MockedProvider>,
    );
  };

  // ── Create mode ───────────────────────────────────────────────────────────

  it('creates a new MCP with name and default member', () => {
    mountWizard();

    cy.get('#name').typeIntoUi5Input('my-new-mcp');
    cy.get('ui5-button').contains('Next').click(); // metadata → members
    cy.get('ui5-button').contains('Next').click(); // members → componentSelection
    cy.get('ui5-button').contains('Next').click(); // componentSelection → summarize
    cy.get('ui5-button').contains('Create').click();

    cy.then(() => {
      cy.wrap(createPayload).should('not.be.null');
      cy.wrap(createPayload!.name).should('eq', 'my-new-mcp');
      cy.wrap(createPayload!.namespace).should('eq', 'my-project--ws-my-workspace');
    });
  });

  it('shows the success step after a successful create', () => {
    mountWizard();

    cy.get('#name').typeIntoUi5Input('my-new-mcp');
    cy.get('ui5-button').contains('Next').click();
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

  const kpiVariables = { name: existingMcp.metadata.name, namespace: existingMcp.metadata.namespace };

  // Not-installed responses for the KPI status queries the wizard always fires in edit mode —
  // every edit-mode test needs all four mocked (installed or not) or Apollo has no matching mock to resolve.
  const notInstalledCrossplaneMock: MockedResponse = {
    request: { query: GetCrossplaneDocument, variables: kpiVariables },
    result: { data: { crossplane_services_open_control_plane_io: { v1alpha1: { Crossplane: null } } } },
  };
  const notInstalledFluxMock: MockedResponse = {
    request: { query: GetFluxDocument, variables: kpiVariables },
    result: { data: { flux_services_open_control_plane_io: { v1alpha1: { Flux: null } } } },
  };
  const notInstalledLandscaperMock: MockedResponse = {
    request: { query: GetLandscaperDocument, variables: kpiVariables },
    result: { data: { landscaper_services_open_control_plane_io: { v1alpha2: { Landscaper: null } } } },
  };
  const notInstalledEsoMock: MockedResponse = {
    request: { query: GetExternalSecretsOperatorDocument, variables: kpiVariables },
    result: {
      data: { external_secrets_services_open_control_plane_io: { v1alpha1: { ExternalSecretsOperator: null } } },
    },
  };

  const installedCrossplaneMock = (version: string, providers: { name: string; version: string }[] = []) =>
    ({
      request: { query: GetCrossplaneDocument, variables: kpiVariables },
      result: {
        data: {
          crossplane_services_open_control_plane_io: {
            v1alpha1: {
              Crossplane: {
                kind: 'Crossplane',
                metadata: { name: existingMcp.metadata.name, namespace: existingMcp.metadata.namespace },
                spec: { version, providers },
                status: { conditions: [] },
              },
            },
          },
        },
      },
    }) satisfies MockedResponse;

  const installedFluxMock = (version: string) =>
    ({
      request: { query: GetFluxDocument, variables: kpiVariables },
      result: {
        data: {
          flux_services_open_control_plane_io: {
            v1alpha1: {
              Flux: {
                metadata: { name: existingMcp.metadata.name, namespace: existingMcp.metadata.namespace },
                spec: { version },
                status: { conditions: [] },
              },
            },
          },
        },
      },
    }) satisfies MockedResponse;

  const installedLandscaperMock = (version: string) =>
    ({
      request: { query: GetLandscaperDocument, variables: kpiVariables },
      result: {
        data: {
          landscaper_services_open_control_plane_io: {
            v1alpha2: {
              Landscaper: {
                metadata: { name: existingMcp.metadata.name, namespace: existingMcp.metadata.namespace },
                spec: { version },
                status: { phase: 'Ready', conditions: [] },
              },
            },
          },
        },
      },
    }) satisfies MockedResponse;

  it('pre-fills the name field from initialData in edit mode', () => {
    mountWizard({ isEditMode: true, initialData: existingMcp }, [
      notInstalledCrossplaneMock,
      notInstalledFluxMock,
      notInstalledLandscaperMock,
      notInstalledEsoMock,
    ]);

    cy.get('#name').should('have.value', 'existing-mcp');
  });

  it('pre-fills members from initialData roleBindings in edit mode', () => {
    mountWizard({ isEditMode: true, initialData: existingMcp }, [
      notInstalledCrossplaneMock,
      notInstalledFluxMock,
      notInstalledLandscaperMock,
      notInstalledEsoMock,
    ]);

    // navigate to members step
    cy.get('ui5-button').contains('Next').click();

    cy.contains('admin@example.com').should('exist');
    cy.contains('viewer@example.com').should('exist');
  });

  it('calls updateMcp with correct payload on submit in edit mode', () => {
    mountWizard({ isEditMode: true, initialData: existingMcp }, [
      notInstalledCrossplaneMock,
      notInstalledFluxMock,
      notInstalledLandscaperMock,
      notInstalledEsoMock,
    ]);

    cy.get('ui5-button').contains('Next').click(); // metadata → members
    cy.get('ui5-button').contains('Next').click(); // members → componentSelection
    cy.get('ui5-button').contains('Next').click(); // componentSelection → summarize
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
    mountWizard({ isEditMode: true, initialData: existingMcp }, [
      notInstalledCrossplaneMock,
      notInstalledFluxMock,
      notInstalledLandscaperMock,
      notInstalledEsoMock,
    ]);

    cy.get('ui5-button').contains('Next').click();
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

    mountWizard(
      { isEditMode: true, initialData: existingMcp, useUpdateManagedControlPlaneV2GraphQL: fakeFailingUpdate },
      [notInstalledCrossplaneMock, notInstalledFluxMock, notInstalledLandscaperMock, notInstalledEsoMock],
    );

    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Update').click();

    // wizard should stay on summarize step and surface the backend error
    cy.contains('Network error').should('exist');
    cy.get('ui5-button').contains('Update').should('exist');
  });

  // ── Edit mode — per-service create/update/delete mutations ─────────────────

  describe('service mutations based on previously-installed state', () => {
    let deleteFluxPayload: { name: string; namespace: string } | null = null;
    let updateLandscaperPayload: { namespace: string; name: string; object: unknown } | null = null;
    let updateCrossplanePayload: { namespace: string; name: string; object: unknown } | null = null;
    let createEsoPayload: { namespace: string; object: unknown } | null = null;
    let createLandscaperCalled = false;
    let deleteEsoCalled = false;

    beforeEach(() => {
      deleteFluxPayload = null;
      updateLandscaperPayload = null;
      updateCrossplanePayload = null;
      createEsoPayload = null;
      createLandscaperCalled = false;
      deleteEsoCalled = false;
    });

    const fakeUseDeleteFlux: typeof useDeleteFlux = () => ({
      deleteFlux: async (variables) => {
        deleteFluxPayload = variables;
        return { data: undefined };
      },
      loading: false,
      error: undefined,
    });

    const fakeUseUpdateLandscaper: typeof useUpdateLandscaper = () => ({
      update: async (variables) => {
        updateLandscaperPayload = variables;
        return { data: undefined };
      },
      loading: false,
      error: undefined,
    });

    const fakeUseCreateLandscaper: typeof useCreateLandscaper = () => ({
      create: async () => {
        createLandscaperCalled = true;
        return { data: undefined };
      },
      loading: false,
      error: undefined,
    });

    const fakeUseUpdateCrossplane: typeof useUpdateCrossplane = () => ({
      update: async (variables) => {
        updateCrossplanePayload = variables;
        return { data: undefined };
      },
      loading: false,
      error: undefined,
    });

    const fakeUseCreateEso: typeof useCreateEso = () => ({
      create: async (variables) => {
        createEsoPayload = variables;
        return { data: undefined };
      },
      loading: false,
      error: undefined,
    });

    const fakeUseDeleteEso: typeof useDeleteEso = () => ({
      deleteEso: async () => {
        deleteEsoCalled = true;
        return { data: undefined };
      },
      loading: false,
      error: undefined,
    });

    it('deletes a previously installed service when deselected before submit', () => {
      mountWizard(
        {
          isEditMode: true,
          initialData: existingMcp,
          useDeleteFlux: fakeUseDeleteFlux,
          useCreateFlux: (() => ({
            create: async () => {
              throw new Error('createFlux should not be called for a deselected, previously installed service');
            },
            loading: false,
            error: undefined,
          })) as typeof useCreateFlux,
        },
        [notInstalledCrossplaneMock, installedFluxMock('v2.18.2'), notInstalledLandscaperMock, notInstalledEsoMock],
      );

      cy.get('ui5-button').contains('Next').click(); // metadata → members
      cy.get('ui5-button').contains('Next').click(); // members → componentSelection

      // Flux comes back pre-selected because it was reported as installed.
      cy.get('[data-testid="service-flux-checkbox"]').should('have.attr', 'checked');
      cy.get('[data-testid="service-flux-checkbox"]').toggleUi5Checkbox();

      cy.get('ui5-button').contains('Next').click(); // componentSelection → summarize
      cy.get('ui5-button').contains('Update').click();

      cy.then(() => {
        cy.wrap(deleteFluxPayload).should('deep.equal', {
          name: existingMcp.metadata.name,
          namespace: existingMcp.metadata.namespace,
        });
      });
    });

    it('updates a previously installed service when its version changes', () => {
      mountWizard(
        {
          isEditMode: true,
          initialData: existingMcp,
          useUpdateLandscaper: fakeUseUpdateLandscaper,
          useCreateLandscaper: fakeUseCreateLandscaper,
        },
        [notInstalledCrossplaneMock, notInstalledFluxMock, installedLandscaperMock('v1.0.5'), notInstalledEsoMock],
      );

      cy.get('ui5-button').contains('Next').click();
      cy.get('ui5-button').contains('Next').click();

      cy.get('[data-testid="service-landscaper-checkbox"]').should('have.attr', 'checked');
      cy.get('[data-testid="service-landscaper-version"]').openDropDownByClick();
      cy.get('[data-testid="service-landscaper-version"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
        'v1.2.0',
      );

      cy.get('ui5-button').contains('Next').click();
      cy.get('ui5-button').contains('Update').click();

      cy.then(() => {
        cy.wrap(createLandscaperCalled).should('equal', false);
        cy.wrap(updateLandscaperPayload).should('not.be.null');
        cy.wrap((updateLandscaperPayload!.object as { spec: { version: string } }).spec.version).should('eq', 'v1.2.0');
      });
    });

    it('drops a removed provider from a previously installed Crossplane on update', () => {
      mountWizard(
        {
          isEditMode: true,
          initialData: existingMcp,
          useUpdateCrossplane: fakeUseUpdateCrossplane,
        },
        [
          installedCrossplaneMock('v1.20.1-1', [{ name: 'provider-btp', version: '1.3.0' }]),
          notInstalledFluxMock,
          notInstalledLandscaperMock,
          notInstalledEsoMock,
        ],
      );

      cy.get('ui5-button').contains('Next').click();
      cy.get('ui5-button').contains('Next').click();

      cy.get('[data-testid="service-crossplane-checkbox"]').should('have.attr', 'checked');
      cy.contains('provider-btp').should('exist');
      cy.get('[ui5-checkbox][text="provider-btp"]').toggleUi5Checkbox();

      cy.get('ui5-button').contains('Next').click();
      cy.get('ui5-button').contains('Update').click();

      cy.then(() => {
        cy.wrap(updateCrossplanePayload).should('not.be.null');
        cy.wrap((updateCrossplanePayload!.object as { spec: { providers: unknown[] } }).spec.providers).should(
          'deep.equal',
          [],
        );
      });
    });

    it('creates a not-previously-installed service that gets newly selected', () => {
      mountWizard(
        {
          isEditMode: true,
          initialData: existingMcp,
          useCreateEso: fakeUseCreateEso,
          useDeleteEso: fakeUseDeleteEso,
        },
        [notInstalledCrossplaneMock, notInstalledFluxMock, notInstalledLandscaperMock, notInstalledEsoMock],
      );

      cy.get('ui5-button').contains('Next').click();
      cy.get('ui5-button').contains('Next').click();

      cy.get('[data-testid="service-externalSecretsOperator-checkbox"]').should('not.have.attr', 'checked');
      cy.get('[data-testid="service-externalSecretsOperator-checkbox"]').toggleUi5Checkbox();

      cy.get('ui5-button').contains('Next').click();
      cy.get('ui5-button').contains('Update').click();

      cy.then(() => {
        cy.wrap(deleteEsoCalled).should('equal', false);
        cy.wrap(createEsoPayload).should('not.be.null');
      });
    });
  });
});
