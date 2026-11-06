import { MockedProvider } from '@apollo/client/testing/react';
import type { ComponentProps } from 'react';
import { YamlApplyDialog } from './YamlApplyDialog';
// Sets up i18n so t() works in tests.
import '../../utils/i18n/i18n';

// Generic kinds skip existence checks and CRD resolution, so no network stubs needed.
const yamlFile = (fileName: string, kind: string, name: string) =>
  new File([`apiVersion: v1\nkind: ${kind}\nmetadata:\n  name: ${name}\n`], fileName, {
    type: 'application/yaml',
  });

const mountDialog = (props: Partial<ComponentProps<typeof YamlApplyDialog>>) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <YamlApplyDialog
        files={props.files ?? []}
        targetApiConfig={null}
        targetName="Onboarding API"
        onClose={props.onClose ?? cy.stub()}
        {...props}
      />
    </MockedProvider>,
  );

describe('YamlApplyDialog — queue management', () => {
  it('renders one rail item per document', () => {
    mountDialog({ files: [yamlFile('a.yaml', 'ConfigMap', 'cm-a'), yamlFile('b.yaml', 'Secret', 'sec-b')] });

    cy.get('[data-testid="yaml-apply-item-0"]').should('be.visible');
    cy.get('[data-testid="yaml-apply-item-1"]').should('be.visible');
    cy.get('[data-testid^="yaml-apply-item-"]').should('have.length', 2);
    cy.contains('ConfigMap/cm-a').should('be.visible');
    cy.contains('Secret/sec-b').should('be.visible');
  });

  it('splits a multi-document file (--- separated) into one rail item per resource', () => {
    const multiDoc = new File(
      [
        'apiVersion: v1\nkind: Service\nmetadata:\n  name: my-nginx-svc\n',
        '---\n',
        'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-nginx\n',
      ],
      'nginx.yaml',
      { type: 'application/yaml' },
    );
    mountDialog({ files: [multiDoc] });

    cy.get('[data-testid^="yaml-apply-item-"]').should('have.length', 2);
    cy.contains('Service/my-nginx-svc').should('be.visible');
    cy.contains('Deployment/my-nginx').should('be.visible');
  });

  it('expands a kind: List wrapper into one rail item per item', () => {
    const listFile = new File(
      [
        'apiVersion: v1\nkind: List\nitems:\n',
        '  - { apiVersion: v1, kind: ConfigMap, metadata: { name: cm-a } }\n',
        '  - { apiVersion: v1, kind: Secret, metadata: { name: sec-b } }\n',
      ],
      'list.yaml',
      { type: 'application/yaml' },
    );
    mountDialog({ files: [listFile] });

    cy.get('[data-testid^="yaml-apply-item-"]').should('have.length', 2);
    cy.contains('ConfigMap/cm-a').should('be.visible');
    cy.contains('Secret/sec-b').should('be.visible');
  });

  it('removes a single resource from the list via its remove button', () => {
    mountDialog({ files: [yamlFile('a.yaml', 'ConfigMap', 'cm-a'), yamlFile('b.yaml', 'Secret', 'sec-b')] });

    cy.get('[data-testid="yaml-apply-item-1"]').should('be.visible');
    cy.get('[data-testid="yaml-apply-remove-0"]').click();

    cy.get('[data-testid^="yaml-apply-item-"]').should('have.length', 1);
    cy.contains('ConfigMap/cm-a').should('not.exist');
    cy.contains('Secret/sec-b').should('be.visible');
  });

  it('disables remove for the only resource and does not close the dialog', () => {
    const onClose = cy.stub().as('onClose');
    mountDialog({ files: [yamlFile('a.yaml', 'ConfigMap', 'cm-a')], onClose });

    cy.get('[data-testid="yaml-apply-remove-0"]').should('have.attr', 'disabled');
    cy.get('[data-testid="yaml-apply-remove-0"]').click({ force: true });
    cy.get('[data-testid^="yaml-apply-item-"]').should('have.length', 1);
    cy.get('@onClose').should('not.have.been.called');
  });

  it('adds a dropped-in file to the list via the Add file input', () => {
    mountDialog({ files: [yamlFile('a.yaml', 'ConfigMap', 'cm-a')] });

    cy.get('[data-testid="yaml-apply-item-0"]').should('be.visible');
    cy.get('[data-testid="yaml-apply-add-input"]').selectFile(
      { contents: Cypress.Buffer.from('apiVersion: v1\nkind: Secret\nmetadata:\n  name: sec-b\n'), fileName: 'b.yaml' },
      { force: true },
    );

    cy.get('[data-testid^="yaml-apply-item-"]').should('have.length', 2);
    cy.contains('Secret/sec-b').should('be.visible');
  });

  it('skips a duplicate resource and shows an error when adding', () => {
    mountDialog({ files: [yamlFile('a.yaml', 'ConfigMap', 'cm-a')] });

    cy.get('[data-testid="yaml-apply-item-0"]').should('be.visible');
    cy.get('[data-testid="yaml-apply-add-input"]').selectFile(
      {
        contents: Cypress.Buffer.from('apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: cm-a\n'),
        fileName: 'dup.yaml',
      },
      { force: true },
    );

    cy.get('[data-testid="yaml-apply-add-error"]').should('be.visible');
    cy.get('[data-testid^="yaml-apply-item-"]').should('have.length', 1);
  });

  it('rejects a non-YAML file on add', () => {
    mountDialog({ files: [yamlFile('a.yaml', 'ConfigMap', 'cm-a')] });

    cy.get('[data-testid="yaml-apply-item-0"]').should('be.visible');
    cy.get('[data-testid="yaml-apply-add-input"]').selectFile(
      { contents: Cypress.Buffer.from('not yaml'), fileName: 'notes.txt' },
      { force: true },
    );

    cy.get('[data-testid="yaml-apply-add-error"]').should('be.visible');
    cy.get('[data-testid^="yaml-apply-item-"]').should('have.length', 1);
  });
});

describe('YamlApplyDialog — parse errors', () => {
  const rawFile = (fileName: string, content: string) => new File([content], fileName, { type: 'application/yaml' });

  it('shows the empty-file message for a file with no resources', () => {
    mountDialog({ files: [rawFile('empty.yaml', '---\n# just a comment\n---\n')] });

    cy.contains('This file has no YAML resources to apply').should('be.visible');
    // Must not show the "missing required fields" fallback.
    cy.contains('Missing required fields').should('not.exist');
  });

  it('shows the file-type message for a non-YAML extension', () => {
    mountDialog({ files: [rawFile('notes.txt', 'anything')] });

    cy.contains('Only .yaml and .yml files are supported').should('be.visible');
  });
});

describe('YamlApplyDialog — Control Plane API discovery', () => {
  const targetApiConfig = {
    mcpConfig: { projectName: 'project', workspaceName: 'workspace', controlPlaneName: 'cp' },
  };
  const secret =
    'apiVersion: v1\nkind: Secret\nmetadata:\n  name: test-secret\n  namespace: ns\ndata:\n  token: dGVzdA==\n';
  const configMap = 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test-config\n  namespace: ns\n';

  beforeEach(() => {
    // Built-in kinds are deliberately absent from the CRD list.
    cy.intercept('GET', '/api/onboarding/apis/apiextensions.k8s.io/v1/customresourcedefinitions', {
      items: [],
    });
    cy.intercept('GET', '/api/onboarding/api/v1', {
      resources: [
        { name: 'secrets', kind: 'Secret', namespaced: true },
        { name: 'configmaps', kind: 'ConfigMap', namespaced: true },
      ],
    }).as('discovery');
    cy.intercept('GET', '/api/onboarding/api/v1/namespaces/ns/secrets/test-secret', {
      statusCode: 404,
      body: { message: 'Not found' },
    }).as('checkSecret');
    cy.intercept('PATCH', '/api/onboarding/api/v1/namespaces/ns/secrets/test-secret?*', { body: {} }).as('applySecret');
  });

  it('allows dry run and apply of a Secret without a CRD', () => {
    mountDialog({
      files: [new File([secret], 'secret.yaml', { type: 'application/yaml' })],
      targetApiConfig,
    });

    cy.wait('@discovery');
    cy.wait('@checkSecret');
    cy.contains('Could not resolve resource type').should('not.exist');
    cy.contains('ui5-button', 'Dry run')
      .should(($button) => expect($button).not.to.have.attr('disabled'))
      .click();
    cy.wait('@applySecret').then(({ request }) => {
      expect(request.query.dryRun).to.equal('All');
      expect(request.headers['content-type']).to.equal('application/apply-patch+yaml');
      expect(request.body).to.contain('token: dGVzdA==');
    });
    cy.contains('Dry run passed').should('be.visible');

    cy.contains('ui5-button', 'Create')
      .should(($button) => expect($button).not.to.have.attr('disabled'))
      .click();
    cy.wait('@applySecret').then(({ request }) => {
      expect(request.query).not.to.have.property('dryRun');
    });
    cy.contains('All resources applied').should('be.visible');
  });

  it('applies all built-in resources in a multi-document upload', () => {
    cy.intercept('PATCH', '/api/onboarding/api/v1/namespaces/ns/configmaps/test-config?*', { body: {} }).as(
      'applyConfigMap',
    );
    mountDialog({
      files: [new File([secret, '---\n', configMap], 'resources.yaml', { type: 'application/yaml' })],
      targetApiConfig,
    });

    cy.wait('@checkSecret');
    cy.contains('ui5-button', 'Apply all')
      .should(($button) => expect($button).not.to.have.attr('disabled'))
      .click();
    cy.wait('@applySecret');
    cy.wait('@applyConfigMap');
    cy.contains('All resources applied').should('be.visible');
    cy.contains('2 resources applied successfully').should('be.visible');
  });
});
