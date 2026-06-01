import { ComponentInstallDialog, UseCreateMutationResult, UseUpdateMutationResult } from './ComponentInstallDialog.tsx';
import { UseManagedServicesQueryResult, useManagedServicesQuery } from '../../hooks/useManagedServicesQuery.ts';

type CreateVariables = { namespace: string; object: unknown };
type UpdateVariables = { namespace: string; name: string; object: unknown };

describe('ComponentInstallDialog', () => {
  let createPayload: CreateVariables | null = null;
  let updatePayload: UpdateVariables | null = null;

  const fakeUseCreateMutation: () => UseCreateMutationResult = () => ({
    create: async (variables: CreateVariables) => {
      createPayload = variables;
      return {};
    },
    loading: false,
  });

  const fakeUseUpdateMutation: () => UseUpdateMutationResult = () => ({
    update: async (variables: UpdateVariables) => {
      updatePayload = variables;
      return {};
    },
    loading: false,
  });

  const fakeUseManagedServicesQuery: typeof useManagedServicesQuery = (() => ({
    managedServicesData: null,
    isLoading: false,
    error: null,
    services: [
      {
        name: 'flux',
        kind: 'Flux',
        apiVersion: 'flux.services.openmcp.cloud/v1alpha1',
        versions: [{ version: 'v2.18.2' }, { version: 'v2.17.0' }],
      },
    ],
    crossplaneProviders: [],
  })) as () => UseManagedServicesQueryResult;

  const baseObject = {
    apiVersion: 'flux.services.openmcp.cloud/v1alpha1',
    kind: 'Flux',
    metadata: { name: 'test-mcp', namespace: 'test-namespace' },
  };

  beforeEach(() => {
    createPayload = null;
    updatePayload = null;
  });

  it('installs a component with a selected version', () => {
    const onClose = cy.stub();

    cy.mount(
      <ComponentInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        componentName="Flux"
        serviceName="flux"
        useCreateMutation={fakeUseCreateMutation}
        useUpdateMutation={fakeUseUpdateMutation}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('[ui5-select][data-cy="component-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="component-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v2.18.2',
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.then(() =>
      cy.wrap(createPayload).deepEqualJson({
        namespace: 'test-namespace',
        object: {
          ...baseObject,
          spec: { version: 'v2.18.2' },
        },
      }),
    );

    cy.contains('Flux has been successfully installed.').should('be.visible');
    cy.wrap(onClose).should('have.been.called');
  });

  it('does not submit when version is missing', () => {
    const onClose = cy.stub();

    cy.mount(
      <ComponentInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        componentName="Flux"
        serviceName="flux"
        useCreateMutation={fakeUseCreateMutation}
        useUpdateMutation={fakeUseUpdateMutation}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.then(() => cy.wrap(createPayload).should('be.null'));
    cy.wrap(onClose).should('not.have.been.called');
  });

  it('updates a component with pre-loaded initial version', () => {
    const onClose = cy.stub();

    cy.mount(
      <ComponentInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        componentName="Flux"
        serviceName="flux"
        mode="edit"
        initialVersion="v2.17.0"
        useCreateMutation={fakeUseCreateMutation}
        useUpdateMutation={fakeUseUpdateMutation}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.then(() =>
      cy.wrap(updatePayload).deepEqualJson({
        namespace: 'test-namespace',
        name: 'test-mcp',
        object: {
          ...baseObject,
          spec: { version: 'v2.17.0' },
        },
      }),
    );

    cy.contains('Flux has been successfully updated.').should('be.visible');
    cy.wrap(onClose).should('have.been.called');
  });

  it('pre-fills the version select in edit mode', () => {
    cy.mount(
      <ComponentInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        componentName="Flux"
        serviceName="flux"
        mode="edit"
        initialVersion="v2.17.0"
        useCreateMutation={fakeUseCreateMutation}
        useUpdateMutation={fakeUseUpdateMutation}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={cy.stub()}
      />,
    );

    cy.get('[ui5-select][data-cy="component-version-select"]').should('contain.text', 'v2.17.0');
  });

  it('shows an error toast and keeps the dialog open when the create mutation fails', () => {
    const onClose = cy.stub();
    const fakeUseFailingCreate: () => UseCreateMutationResult = () => ({
      create: async () => {
        throw new Error('boom');
      },
      loading: false,
    });

    cy.mount(
      <ComponentInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        componentName="Flux"
        serviceName="flux"
        useCreateMutation={fakeUseFailingCreate}
        useUpdateMutation={fakeUseUpdateMutation}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('[ui5-select][data-cy="component-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="component-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v2.18.2',
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.contains('Failed to install Flux. Please try again.').should('be.visible');
    cy.wrap(onClose).should('not.have.been.called');
  });

  it('shows an error toast and keeps the dialog open when the update mutation fails', () => {
    const onClose = cy.stub();
    const fakeUseFailingUpdate: () => UseUpdateMutationResult = () => ({
      update: async () => {
        throw new Error('boom');
      },
      loading: false,
    });

    cy.mount(
      <ComponentInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        componentName="Flux"
        serviceName="flux"
        mode="edit"
        initialVersion="v2.17.0"
        useCreateMutation={fakeUseCreateMutation}
        useUpdateMutation={fakeUseFailingUpdate}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.contains('Failed to update Flux. Please try again.').should('be.visible');
    cy.wrap(onClose).should('not.have.been.called');
  });

  it('closes the dialog when cancel is clicked', () => {
    const onClose = cy.stub();

    cy.mount(
      <ComponentInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        componentName="Flux"
        serviceName="flux"
        useCreateMutation={fakeUseCreateMutation}
        useUpdateMutation={fakeUseUpdateMutation}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('ui5-button').contains('Cancel').click();

    cy.wrap(onClose).should('have.been.called');
    cy.then(() => cy.wrap(createPayload).should('be.null'));
  });

  it('changes version in edit mode and submits the updated version', () => {
    const onClose = cy.stub();

    cy.mount(
      <ComponentInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        componentName="Flux"
        serviceName="flux"
        mode="edit"
        initialVersion="v2.17.0"
        useCreateMutation={fakeUseCreateMutation}
        useUpdateMutation={fakeUseUpdateMutation}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('[ui5-select][data-cy="component-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="component-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v2.18.2',
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.then(() =>
      cy.wrap(updatePayload).deepEqualJson({
        namespace: 'test-namespace',
        name: 'test-mcp',
        object: {
          ...baseObject,
          spec: { version: 'v2.18.2' },
        },
      }),
    );
  });
});
