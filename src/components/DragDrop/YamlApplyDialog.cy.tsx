import { MockedProvider } from '@apollo/client/testing/react';
import type { ComponentProps } from 'react';
import { YamlApplyDialog } from './YamlApplyDialog';
// Initialise i18next so t() returns the English strings the dialog renders.
import '../../utils/i18n/i18n';

// Generic (non-onboarding) kinds keep the flow offline: no existence check and no CRD plural
// resolution fire, so the queue/rail can be exercised without stubbing the network.
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
    // Must not fall through to the "missing required fields" message.
    cy.contains('Missing required fields').should('not.exist');
  });

  it('shows the file-type message for a non-YAML extension', () => {
    mountDialog({ files: [rawFile('notes.txt', 'anything')] });

    cy.contains('Only .yaml and .yml files are supported').should('be.visible');
  });
});
