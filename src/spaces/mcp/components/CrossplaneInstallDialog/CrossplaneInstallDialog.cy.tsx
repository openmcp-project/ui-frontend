import { CrossplaneInstallDialog } from './CrossplaneInstallDialog.tsx';
import { useCreateCrossplane } from '../../hooks/useCreateCrossplane.ts';
import { useUpdateCrossplane } from '../../hooks/useUpdateCrossplane.ts';
import { UseManagedServicesQueryResult, useManagedServicesQuery } from '../../hooks/useManagedServicesQuery.ts';
import type { CrossplaneData } from '../../types/Crossplane.ts';

type CreateVariables = { namespace: string; object: unknown };
type UpdateVariables = { namespace: string; name: string; object: unknown };

describe('CrossplaneInstallDialog', () => {
  let createPayload: CreateVariables | null = null;
  let updatePayload: UpdateVariables | null = null;

  const fakeUseCreateCrossplane: typeof useCreateCrossplane = () => ({
    create: async (variables: CreateVariables) => {
      createPayload = variables;
      return {} as Awaited<ReturnType<ReturnType<typeof useCreateCrossplane>['create']>>;
    },
    loading: false,
    error: undefined,
  });

  const fakeUseUpdateCrossplane: typeof useUpdateCrossplane = () => ({
    update: async (variables: UpdateVariables) => {
      updatePayload = variables;
      return {} as Awaited<ReturnType<ReturnType<typeof useUpdateCrossplane>['update']>>;
    },
    loading: false,
    error: undefined,
  });

  const fakeUseManagedServicesQuery: typeof useManagedServicesQuery = (() => ({
    managedServicesData: null,
    isLoading: false,
    error: null,
    services: [
      {
        name: 'crossplane',
        kind: 'Crossplane',
        apiVersion: 'crossplane.services.open-control-plane.io/v1alpha1',
        versions: [{ version: 'v2.0.2-1' }, { version: 'v1.20.1-1' }],
      },
    ],
    crossplaneProviders: [
      { name: 'provider-btp', versions: [{ version: '1.3.0' }] },
      { name: 'provider-helm', versions: [{ version: '1.0.1' }] },
      { name: 'provider-vault', versions: [{ version: '1.0.0' }, { version: '2.2.1' }] },
      { name: 'provider-no-versions', versions: [] },
    ],
  })) as () => UseManagedServicesQueryResult;

  const fakeUseManagedServicesQueryNoVersions: typeof useManagedServicesQuery = (() => ({
    managedServicesData: null,
    isLoading: false,
    error: null,
    services: [
      {
        name: 'crossplane',
        kind: 'Crossplane',
        apiVersion: 'crossplane.services.open-control-plane.io/v1alpha1',
        versions: [],
      },
    ],
    crossplaneProviders: [],
  })) as () => UseManagedServicesQueryResult;

  const baseObject = {
    apiVersion: 'crossplane.services.open-control-plane.io/v1alpha1',
    kind: 'Crossplane',
    metadata: { name: 'test-mcp', namespace: 'test-namespace' },
  };

  beforeEach(() => {
    createPayload = null;
    updatePayload = null;
  });

  it('installs Crossplane with selected version and one provider', () => {
    const onClose = cy.stub();

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('[ui5-select][data-cy="crossplane-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="crossplane-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v1.20.1-1',
    );

    cy.get('[ui5-checkbox][text="provider-btp"]').toggleUi5Checkbox();

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.then(() =>
      cy.wrap(createPayload).deepEqualJson({
        namespace: 'test-namespace',
        object: {
          ...baseObject,
          spec: {
            version: 'v1.20.1-1',
            providers: [{ name: 'provider-btp', version: '1.3.0' }],
          },
        },
      }),
    );

    cy.contains('Crossplane has been successfully installed.').should('be.visible');
    cy.wrap(onClose).should('have.been.called');
  });

  it('does not submit when crossplane version is missing', () => {
    const onClose = cy.stub();

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQueryNoVersions}
        onClose={onClose}
      />,
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.then(() => cy.wrap(createPayload).should('be.null'));
    cy.wrap(onClose).should('not.have.been.called');
  });

  it('preselects the highest crossplane version in install mode', () => {
    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={cy.stub()}
      />,
    );

    cy.get('[ui5-select][data-cy="crossplane-version-select"]').should('contain.text', 'v2.0.2-1');
  });

  it('preselects the highest version for a provider when its checkbox is checked', () => {
    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={cy.stub()}
      />,
    );

    cy.get('[ui5-select][data-cy="crossplane-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="crossplane-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v1.20.1-1',
    );

    cy.get('[ui5-checkbox][text="provider-vault"]').toggleUi5Checkbox();

    cy.get('[ui5-select][data-cy="provider-version-select-provider-vault"]').should('contain.text', '2.2.1');
  });

  it('keeps a manually selected provider version after unchecking and rechecking', () => {
    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={cy.stub()}
      />,
    );

    cy.get('[ui5-select][data-cy="crossplane-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="crossplane-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v1.20.1-1',
    );

    cy.get('[ui5-checkbox][text="provider-vault"]').toggleUi5Checkbox();
    cy.get('[ui5-select][data-cy="provider-version-select-provider-vault"]').should('contain.text', '2.2.1');

    cy.get('[ui5-select][data-cy="provider-version-select-provider-vault"]').openDropDownByClick();
    cy.get(
      '[ui5-select][data-cy="provider-version-select-provider-vault"]',
    ).clickDropdownMenuItemByText<Cypress.TriggerOptions>('1.0.0');

    cy.get('[ui5-checkbox][text="provider-vault"]').toggleUi5Checkbox();
    cy.get('[ui5-checkbox][text="provider-vault"]').toggleUi5Checkbox();

    cy.get('[ui5-select][data-cy="provider-version-select-provider-vault"]').should('contain.text', '1.0.0');
  });

  it('installs Crossplane with multiple providers', () => {
    const onClose = cy.stub();

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('[ui5-select][data-cy="crossplane-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="crossplane-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v1.20.1-1',
    );

    cy.get('[ui5-checkbox][text="provider-btp"]').toggleUi5Checkbox();
    cy.get('[ui5-checkbox][text="provider-helm"]').toggleUi5Checkbox();

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.then(() =>
      cy.wrap(createPayload).deepEqualJson({
        namespace: 'test-namespace',
        object: {
          ...baseObject,
          spec: {
            version: 'v1.20.1-1',
            providers: [
              { name: 'provider-btp', version: '1.3.0' },
              { name: 'provider-helm', version: '1.0.1' },
            ],
          },
        },
      }),
    );
  });

  it('installs Crossplane with an empty providers array when none are selected', () => {
    const onClose = cy.stub();

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('[ui5-select][data-cy="crossplane-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="crossplane-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v1.20.1-1',
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.then(() =>
      cy.wrap(createPayload).deepEqualJson({
        namespace: 'test-namespace',
        object: {
          ...baseObject,
          spec: { version: 'v1.20.1-1', providers: [] },
        },
      }),
    );
  });

  it('updates Crossplane reflecting a deselected provider', () => {
    const initialData: CrossplaneData = {
      isInstalled: true,
      version: 'v1.20.1-1',
      providers: [{ name: 'provider-btp', version: '1.3.0' }],
    };
    const onClose = cy.stub();

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        mode="edit"
        initialData={initialData}
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('[ui5-checkbox][text="provider-btp"]').toggleUi5Checkbox();
    cy.get('ui5-button').contains('Apply Changes').click();

    cy.then(() =>
      cy.wrap(updatePayload).deepEqualJson({
        namespace: 'test-namespace',
        name: 'test-mcp',
        object: {
          ...baseObject,
          spec: { version: 'v1.20.1-1', providers: [] },
        },
      }),
    );
  });

  it('updates Crossplane with pre-loaded initial data', () => {
    const initialData: CrossplaneData = {
      isInstalled: true,
      version: 'v1.20.1-1',
      providers: [{ name: 'provider-btp', version: '1.3.0' }],
    };
    const onClose = cy.stub();

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        mode="edit"
        initialData={initialData}
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
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
          spec: {
            version: 'v1.20.1-1',
            providers: [{ name: 'provider-btp', version: '1.3.0' }],
          },
        },
      }),
    );

    cy.wrap(onClose).should('have.been.called');
  });

  it('shows a validation error when a provider is selected without a version', () => {
    const onClose = cy.stub();

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('[ui5-select][data-cy="crossplane-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="crossplane-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v1.20.1-1',
    );

    cy.get('[ui5-checkbox][text="provider-no-versions"]').toggleUi5Checkbox();

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.get('[ui5-select][data-cy="provider-version-select-provider-no-versions"]').should(
      'have.attr',
      'value-state',
      'Negative',
    );

    cy.then(() => cy.wrap(createPayload).should('be.null'));
    cy.wrap(onClose).should('not.have.been.called');
  });

  it('pre-fills form fields in edit mode', () => {
    const initialData: CrossplaneData = {
      isInstalled: true,
      version: 'v1.20.1-1',
      providers: [{ name: 'provider-btp', version: '1.3.0' }],
    };

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        mode="edit"
        initialData={initialData}
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={cy.stub()}
      />,
    );

    cy.get('[ui5-select][data-cy="crossplane-version-select"]').should('contain.text', 'v1.20.1-1');
    cy.get('[ui5-checkbox][text="provider-btp"]').should('have.attr', 'checked');
    cy.get('[ui5-checkbox][text="provider-helm"]').should('not.have.attr', 'checked');
    cy.get('[ui5-select][data-cy="provider-version-select-provider-btp"]').should('contain.text', '1.3.0');
  });

  it('shows an error toast and keeps the dialog open when the mutation fails', () => {
    const onClose = cy.stub();
    const fakeUseFailingCreate: typeof useCreateCrossplane = () => ({
      create: async () => {
        throw new Error('boom');
      },
      loading: false,
      error: undefined,
    });

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseFailingCreate}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('[ui5-select][data-cy="crossplane-version-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="crossplane-version-select"]').clickDropdownMenuItemByText<Cypress.TriggerOptions>(
      'v1.20.1-1',
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.contains('Failed to install Crossplane. Please try again.').should('be.visible');
    cy.wrap(onClose).should('not.have.been.called');
  });

  it('shows an error toast and keeps the dialog open when the update mutation fails', () => {
    const initialData: CrossplaneData = {
      isInstalled: true,
      version: 'v1.20.1-1',
      providers: [{ name: 'provider-btp', version: '1.3.0' }],
    };
    const onClose = cy.stub();
    const fakeUseFailingUpdate: typeof useUpdateCrossplane = () => ({
      update: async () => {
        throw new Error('boom');
      },
      loading: false,
      error: undefined,
    });

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        mode="edit"
        initialData={initialData}
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseFailingUpdate}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('ui5-button').contains('Apply Changes').click();

    cy.contains('Failed to update Crossplane. Please try again.').should('be.visible');
    cy.wrap(onClose).should('not.have.been.called');
  });

  it('closes the dialog when cancel is clicked', () => {
    const onClose = cy.stub();

    cy.mount(
      <CrossplaneInstallDialog
        open={true}
        mcpName="test-mcp"
        mcpNamespace="test-namespace"
        useCreateCrossplane={fakeUseCreateCrossplane}
        useUpdateCrossplane={fakeUseUpdateCrossplane}
        useManagedServicesQuery={fakeUseManagedServicesQuery}
        onClose={onClose}
      />,
    );

    cy.get('ui5-button').contains('Cancel').click();

    cy.wrap(onClose).should('have.been.called');
    cy.then(() => cy.wrap(createPayload).should('be.null'));
  });
});
