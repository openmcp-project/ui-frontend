import { McpHeader } from './McpHeader';
import { ControlPlaneType } from '../../../lib/api/types/crate/controlPlanes.ts';

describe('McpHeader', () => {
  it('renders MCP metadata', () => {
    const mcp = {
      metadata: {
        name: 'my-control-plane',
        creationTimestamp: '2024-04-15T10:30:00.000Z',
        annotations: {
          'openmcp.cloud/created-by': 'alice@example.com',
        },
      },
    } as ControlPlaneType;

    cy.clock(new Date('2024-04-17T10:30:00.000Z').getTime()); // 2 days after MCP creation date
    const creationDateAsString = new Date('2024-04-15T10:30:00.000Z').toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    cy.mount(<McpHeader mcp={mcp} />);

    cy.contains('my-control-plane').should('be.visible');
    cy.contains('alice@example.com').should('be.visible');
    cy.contains(`${creationDateAsString} (2 days ago)`).should('be.visible');
  });

  it('renders with missing MCP metadata', () => {
    const mcp = {
      metadata: {
        name: 'my-control-plane',
        creationTimestamp: '2024-04-15T10:30:00.000Z',
      },
    } as ControlPlaneType; // missing annotations

    cy.clock(new Date('2024-04-17T10:30:00.000Z').getTime()); // 2 days after MCP creation date
    const creationDateAsString = new Date('2024-04-15T10:30:00.000Z').toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    cy.mount(<McpHeader mcp={mcp} />);

    cy.contains('my-control-plane').should('be.visible');
    cy.contains(`${creationDateAsString} (2 days ago)`).should('be.visible');
  });
});
