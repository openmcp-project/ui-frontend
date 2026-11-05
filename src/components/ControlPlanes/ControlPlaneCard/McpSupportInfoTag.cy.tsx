import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import { ResolvedSupportInfo } from '../../../lib/supportInfo.ts';
import { McpSupportInfoTag } from './McpSupportInfoTag.tsx';

const mountTag = (resolved: ResolvedSupportInfo) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <McpSupportInfoTag namespace="project-my-proj--ws-my-ws" resourceName="my-mcp" resolved={resolved} />
    </MockedProvider>,
  );

describe('McpSupportInfoTag', () => {
  it('renders the purpose tag with the mcp-specific testId', () => {
    mountTag({ info: { supportLandscape: 'production', supportServiceIds: 'MCP-1' } });

    cy.get('[data-testid="mcp-support-info-tag"]').should('contain', 'Production');
  });

  it('renders the "add" hover tag when no landscape and no inherited source', () => {
    mountTag({ info: {} });

    cy.get('ui5-icon[name="question-mark"]').should('exist');
    cy.get('[data-testid="mcp-support-info-tag"]').should('not.exist');
  });

  it('opens the support-info popover with an Edit action when clicked', () => {
    mountTag({ info: { supportLandscape: 'development', supportServiceIds: 'DEV-42' } });

    cy.get('[data-testid="mcp-support-info-tag"]').click();
    cy.contains('DEV-42').should('exist');
    cy.get('[data-testid="support-info-edit-button"]').should('contain', 'Edit');
  });

  it('shows Override button and inherited indicator when values are inherited', () => {
    mountTag({
      info: { supportLandscape: 'staging' },
      inheritedFrom: { kind: 'Workspace', name: 'parent-ws' },
    });

    cy.get('[data-testid="mcp-support-info-tag"]').should('have.attr', 'data-inherited', 'true').click();
    cy.get('[data-testid="support-info-inherited-from"]').should('contain', 'parent-ws');
    cy.get('[data-testid="support-info-edit-button"]').should('contain', 'Override');
  });
});
