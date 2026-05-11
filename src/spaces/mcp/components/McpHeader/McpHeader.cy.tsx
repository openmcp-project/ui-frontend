import { McpHeader } from './McpHeader.tsx';
import { ControlPlaneType } from '../../../../lib/api/types/crate/controlPlanes.ts';

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

    cy.mount(<McpHeader mcp={mcp} />);

    cy.contains('my-control-plane').should('be.visible');
    cy.contains('alice@example.com').should('be.visible');
    // Just check that a date is displayed, don't check exact format
    cy.contains('2024').should('be.visible');
  });

  it('renders with missing MCP metadata', () => {
    const mcp = {
      metadata: {
        name: 'my-control-plane',
        creationTimestamp: '2024-04-15T10:30:00.000Z',
      },
    } as ControlPlaneType; // missing annotations

    cy.mount(<McpHeader mcp={mcp} />);

    cy.contains('my-control-plane').should('be.visible');
    // Just check that a date is displayed
    cy.contains('2024').should('be.visible');
  });
});
