import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import { ResolvedSupportInfo } from '../../../lib/supportInfo.ts';
import { WorkspaceSupportInfoTag } from './WorkspaceSupportInfoTag.tsx';

const mountTag = (resolved: ResolvedSupportInfo) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <WorkspaceSupportInfoTag
        workspaceName="existing-workspace"
        namespace="project-test-project"
        resolved={resolved}
      />
    </MockedProvider>,
  );

describe('WorkspaceSupportInfoTag', () => {
  it('renders the purpose tag with the landscape label when support info is present', () => {
    mountTag({
      info: {
        supportLandscape: 'production',
        supportServiceIds: 'ID-1',
        supportSecurityContacts: 'mail:sec@example.com',
        supportOpsContacts: 'mail:ops@example.com',
      },
    });

    cy.get('ui5-tag').should('contain', 'Production');
    cy.get('[data-testid="workspace-support-info-tag"]').should('not.have.attr', 'data-inherited');
  });

  it('opens the support-info popover with an Edit action when the purpose tag is clicked', () => {
    mountTag({ info: { supportLandscape: 'production', supportServiceIds: 'ID-1' } });

    cy.get('ui5-tag').contains('Production').click();
    cy.contains('ID-1').should('exist');
    cy.get('[data-testid="support-info-inherited-from"]').should('not.exist');
    cy.get('[data-testid="support-info-edit-button"]').should('contain', 'Edit');
  });

  it('renders the "add" hover tag when no landscape is set', () => {
    mountTag({ info: {} });

    // no landscape → no purpose label, just the question-mark hover tag
    cy.get('ui5-tag').should('exist').and('not.contain', 'Production');
    cy.get('ui5-icon[name="question-mark"]').should('exist');
  });

  it('marks inherited values and names the source project', () => {
    mountTag({
      info: { supportLandscape: 'staging', supportServiceIds: 'PARENT-ID' },
      inheritedFrom: { kind: 'Project', name: 'parent-project' },
    });

    cy.get('[data-testid="workspace-support-info-tag"]')
      .should('have.attr', 'data-inherited', 'true')
      .and('contain', 'Staging')
      .click();
    cy.get('[data-testid="support-info-inherited-from"]').should('contain', 'parent-project');
    cy.contains('PARENT-ID').should('exist');
    cy.get('[data-testid="support-info-edit-button"]').should('contain', 'Override');
  });
});
