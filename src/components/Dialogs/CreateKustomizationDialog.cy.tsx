import '@ui5/webcomponents-cypress-commands';
import { CreateKustomizationDialog } from './CreateKustomizationDialog';
import { CreateKustomizationParams } from '../../hooks/useCreateKustomization';
import { useApiResource } from '../../lib/api/useApiResource';
import { GitReposResponse } from '../../lib/api/types/flux/listGitRepo';

const fakeRepos = ['my-repo', 'another-repo', 'test-repo'];

const makeGitRepoItems = (names: string[]) =>
  names.map((name) => ({
    metadata: { name, creationTimestamp: '' },
    spec: { package: '' },
    kind: 'GitRepository',
    status: { artifact: { revision: '' } },
  }));

const fakeUseListGitRepositories = (() => ({
  data: { items: makeGitRepoItems(fakeRepos) } as GitReposResponse,
  isLoading: false,
  error: undefined,
  isValidating: false,
})) as unknown as typeof useApiResource;

const fakeUseListGitRepositoriesEmpty = (() => ({
  data: { items: [] as unknown as GitReposResponse['items'] } as GitReposResponse,
  isLoading: false,
  error: undefined,
  isValidating: false,
})) as unknown as typeof useApiResource;

const fakeUseListGitRepositoriesLoading = (() => ({
  data: undefined,
  isLoading: true,
  error: undefined,
  isValidating: false,
})) as unknown as typeof useApiResource;

describe('CreateKustomizationDialog', () => {
  let capturedData: CreateKustomizationParams | null = null;

  const fakeUseCreateKustomization = () => ({
    createKustomization: async (data: CreateKustomizationParams): Promise<void> => {
      capturedData = data;
    },
    isLoading: false,
  });

  const mount = (overrides: object = {}) =>
    cy.mount(
      <CreateKustomizationDialog
        isOpen={true}
        useCreateKustomization={fakeUseCreateKustomization}
        useListGitRepositories={fakeUseListGitRepositories}
        onClose={cy.stub()}
        {...overrides}
      />,
    );

  beforeEach(() => {
    capturedData = null;
  });

  it('renders git repositories as Select options', () => {
    mount();

    cy.get('[data-testid="sourceRefName-select"]').should('exist');
    fakeRepos.forEach((name) => {
      cy.get('[data-testid="sourceRefName-select"]').contains(name);
    });
  });

  it('creates a kustomization with valid data', () => {
    const onClose = cy.stub();
    mount({ onClose });

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

    cy.get('[name="name"]').typeIntoUi5Input('test-kustomization');
    cy.get('[name="interval"]').find('input').clear().type('5m0s');
    cy.get('[ui5-select][data-cy="sourceRefName-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="sourceRefName-select"]').clickDropdownMenuItemByText('test-repo');
    cy.get('[name="path"]').find('input').clear().type('./deploy');

    cy.get('ui5-button').contains('Create').click();

    cy.then(() => cy.wrap(capturedData).deepEqualJson(expectedPayload));
    cy.wrap(onClose).should('have.been.called');
  });

  it('includes substitutions when provided', () => {
    const onClose = cy.stub();
    mount({ onClose });

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

    cy.get('[name="name"]').typeIntoUi5Input('test-kustomization');
    cy.get('[ui5-select][data-cy="sourceRefName-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="sourceRefName-select"]').clickDropdownMenuItemByText('test-repo');

    cy.get('ui5-button').contains('Add Substitution').click();
    cy.get('[name="substitutions.0.key"]').typeIntoUi5Input('key1');
    cy.get('[name="substitutions.0.value"]').typeIntoUi5Input('value1');

    cy.get('ui5-button').contains('Create').click();

    cy.then(() => cy.wrap(capturedData).deepEqualJson(expectedPayload));
    cy.wrap(onClose).should('have.been.called');
  });

  it('validates required fields including sourceRefName', () => {
    const onClose = cy.stub();
    mount({ onClose });

    cy.get('ui5-button').contains('Create').click();

    cy.get('[name="name"]').should('have.attr', 'value-state', 'Negative');
    cy.contains('This field is required').should('exist');
    cy.get('[data-testid="sourceRefName-select"]').should('have.attr', 'value-state', 'Negative');

    cy.wrap(onClose).should('not.have.been.called');
  });

  it('closes dialog when cancel is clicked', () => {
    const onClose = cy.stub();
    mount({ onClose });

    cy.get('[name="name"]').typeIntoUi5Input('test-kustomization');
    cy.get('ui5-button').contains('Cancel').click();

    cy.wrap(onClose).should('have.been.called');
  });

  it('uses default values for interval and prune', () => {
    mount();

    cy.get('[name="interval"]').find('input').should('have.value', '1m0s');
    cy.get('[name="path"]').find('input').should('have.value', './');
    cy.get('[name="prune"]').should('have.attr', 'checked');
  });

  it('shows loading state while repositories are being fetched', () => {
    mount({ useListGitRepositories: fakeUseListGitRepositoriesLoading });

    cy.get('[data-testid="sourceRefName-select"]').should('have.attr', 'disabled');
    cy.get('[data-testid="sourceRefName-select"]').contains('Loading repositories');
  });

  it('shows only the placeholder when no repositories exist', () => {
    mount({ useListGitRepositories: fakeUseListGitRepositoriesEmpty });

    cy.get('[data-testid="sourceRefName-select"]').should('exist');
    cy.get('[data-testid="sourceRefName-select"] ui5-option[data-value]').should('have.length', 1);
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
        useListGitRepositories={fakeUseListGitRepositories}
        onClose={onClose}
      />,
    );

    cy.get('[name="name"]').typeIntoUi5Input('test-kustomization');
    cy.get('[ui5-select][data-cy="sourceRefName-select"]').openDropDownByClick();
    cy.get('[ui5-select][data-cy="sourceRefName-select"]').clickDropdownMenuItemByText('test-repo');

    cy.get('ui5-button').contains('Create').click();

    cy.wrap(onClose).should('not.have.been.called');
    cy.contains('Create Kustomization').should('be.visible');
  });
});
