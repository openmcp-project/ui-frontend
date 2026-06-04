import '@ui5/webcomponents-cypress-commands';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { WorkspaceHealthIndicator } from './WorkspaceHealthIndicator.tsx';

function makeCps(ready: number, notReady: number, progressing: number, deleting: number): ControlPlaneListItem[] {
  const cps: ControlPlaneListItem[] = [];
  const push = (status: (typeof ReadyStatus)[keyof typeof ReadyStatus], n: number) => {
    for (let i = 0; i < n; i++) {
      cps.push({
        version: 'v1',
        metadata: { name: `mcp-${status}-${i}`, namespace: 'ns', creationTimestamp: '2024-01-01', annotations: {} },
        status: { status, conditions: [], access: undefined },
      });
    }
  };
  push(ReadyStatus.Ready, ready);
  push(ReadyStatus.NotReady, notReady);
  push(ReadyStatus.Progressing, progressing);
  push(ReadyStatus.InDeletion, deleting);
  return cps;
}

describe('WorkspaceHealthIndicator', () => {
  it('renders 1 pill for 1 MCP', () => {
    cy.mount(<WorkspaceHealthIndicator controlPlanes={makeCps(1, 0, 0, 0)} />);
    cy.get('[data-testid="health-pill"]').should('have.length', 1);
  });

  it('renders 3 pills for 3 MCPs', () => {
    cy.mount(<WorkspaceHealthIndicator controlPlanes={makeCps(3, 0, 0, 0)} />);
    cy.get('[data-testid="health-pill"]').should('have.length', 3);
  });

  it('renders max 5 pills for more than 5 MCPs', () => {
    cy.mount(<WorkspaceHealthIndicator controlPlanes={makeCps(6, 2, 1, 1)} />);
    cy.get('[data-testid="health-pill"]').should('have.length', 5);
  });

  it('renders no pills for empty control planes', () => {
    cy.mount(<WorkspaceHealthIndicator controlPlanes={[]} />);
    cy.get('[data-testid="health-pill"]').should('have.length', 0);
  });

  it('reveals status summary on hover', () => {
    cy.mount(<WorkspaceHealthIndicator controlPlanes={makeCps(2, 1, 0, 0)} />);

    const container = cy.get('[class*="container"]');
    container.trigger('mouseenter', { force: true });

    cy.wait(350);
    container.should('contain.text', '2 Ready');
    container.should('contain.text', '1 Not Ready');
  });
});
