import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import { SupportInfo } from '../../../lib/supportInfo.ts';
import { WorkspaceSupportInfoTag } from './WorkspaceSupportInfoTag.tsx';

const mountTag = (supportInfo: SupportInfo) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <WorkspaceSupportInfoTag
        workspaceName="existing-workspace"
        namespace="project-test-project"
        supportInfo={supportInfo}
      />
    </MockedProvider>,
  );

describe('WorkspaceSupportInfoTag', () => {
  it('renders the purpose tag with the landscape label when support info is present', () => {
    mountTag({
      supportLandscape: 'production',
      supportServiceIds: 'ID-1',
      supportSecurityContacts: 'mail:sec@example.com',
      supportOpsContacts: 'mail:ops@example.com',
    });

    cy.get('ui5-tag').should('contain', 'Production');
  });

  it('opens the support-info popover when the purpose tag is clicked', () => {
    mountTag({ supportLandscape: 'production', supportServiceIds: 'ID-1' });

    cy.get('ui5-tag').contains('Production').click();
    cy.contains('ID-1').should('exist');
  });

  it('renders the "add" hover tag when no landscape is set', () => {
    mountTag({});

    // no landscape → no purpose label, just the question-mark hover tag
    cy.get('ui5-tag').should('exist').and('not.contain', 'Production');
    cy.get('ui5-icon[name="question-mark"]').should('exist');
  });
});
