import { McpHeader } from './McpHeader';
import { ControlPlaneType } from '../../../lib/api/types/crate/controlPlanes.ts';

const mcp = {
  metadata: {
    name: 'my-control-plane',
    creationTimestamp: '2024-04-15T10:30:00.000Z',
    annotations: {
      'openmcp.cloud/created-by': 'alice@example.com',
    },
  },
} as ControlPlaneType;

describe('McpHeader', () => {
  it('renders MCP matadata', () => {
    cy.clock(new Date('2024-04-17T10:30:00.000Z').getTime()); // 2 days after MCP creation date
    const creationDateAsString = new Date('2024-04-15T10:30:00.000Z').toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    cy.mount(<McpHeader mcp={mcp} />);

    cy.contains('span', 'my-control-plane').should('be.visible');
    cy.contains('span', 'alice@example.com').should('be.visible');
    cy.contains('span', `${creationDateAsString} (2 days ago)`).should('be.visible');
  });
});
