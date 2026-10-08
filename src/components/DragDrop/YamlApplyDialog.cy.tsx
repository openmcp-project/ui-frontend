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

  it('removes a single resource from the list via its remove button', () => {
    mountDialog({ files: [yamlFile('a.yaml', 'ConfigMap', 'cm-a'), yamlFile('b.yaml', 'Secret', 'sec-b')] });

    cy.get('[data-testid="yaml-apply-item-1"]').should('be.visible');
    cy.get('[data-testid="yaml-apply-remove-0"]').click();

    cy.get('[data-testid^="yaml-apply-item-"]').should('have.length', 1);
    cy.contains('ConfigMap/cm-a').should('not.exist');
    cy.contains('Secret/sec-b').should('be.visible');
  });

  it('closes the dialog when the last remaining resource is removed', () => {
    const onClose = cy.stub().as('onClose');
    mountDialog({ files: [yamlFile('a.yaml', 'ConfigMap', 'cm-a')], onClose });

    cy.get('[data-testid="yaml-apply-remove-0"]').click();
    cy.get('@onClose').should('have.been.calledOnce');
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
