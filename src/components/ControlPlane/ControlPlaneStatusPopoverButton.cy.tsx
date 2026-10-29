import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { FrontendConfigContext } from '../../context/FrontendConfigContext.tsx';
import type { ControlPlaneCondition } from '../../spaces/onboarding/types/ControlPlane.ts';
import {
  ControlPlaneStatusPopoverButton,
  ControlPlaneStatusPopoverButtonProps,
} from './ControlPlaneStatusPopoverButton.tsx';

TimeAgo.addDefaultLocale(en);

const frontendConfig = {
  documentationBaseUrl: 'https://example.com',
  githubBaseUrl: 'https://github.com',
  featureToggles: {
    markMcpV1asDeprecated: false,
    enableMcpV2: true,
    enableHeadlamp: false,
    showLandscaperCard: false,
  },
};

const cond = (type: string, status: 'True' | 'False', reason = '', message = ''): ControlPlaneCondition => ({
  type,
  status,
  reason,
  message,
  lastTransitionTime: '2026-10-20T10:00:00Z',
});

const healthyConditions = [
  cond('Meta', 'True'),
  cond('ClusterRequestReady', 'True'),
  cond('ClusterConditionsSynced', 'True'),
  cond('Cluster.Gardener_APIServerAvailable', 'True'),
  cond('AccessReady.oidc_openmcp', 'True'),
  cond('AllAccessReady', 'True'),
];

const baseProps: ControlPlaneStatusPopoverButtonProps = {
  projectName: 'proj',
  workspaceName: 'ws',
  mcpName: 'cp',
  source: 'card',
};

const mount = (props: Partial<ControlPlaneStatusPopoverButtonProps>) =>
  cy.mount(
    <FrontendConfigContext.Provider value={frontendConfig}>
      <ControlPlaneStatusPopoverButton {...baseProps} {...props} />
    </FrontendConfigContext.Provider>,
  );

const openPopover = () => cy.get('[data-testid="mcp-health-button"]').click();

describe('ControlPlaneStatusPopoverButton', () => {
  it('shows the state as badge text in large mode', () => {
    mount({ phase: 'Progressing', conditions: [cond('Meta', 'False', 'InternalError', 'boom')], large: true });
    cy.get('[data-testid="mcp-health-button"]').should('contain.text', 'Attention needed');
  });

  it('shows Ready and a compact group overview', () => {
    mount({ phase: 'Ready', conditions: healthyConditions, services: { crossplane: { phase: 'Ready' } } });

    openPopover();
    cy.get('[data-testid="cp-status-state"]').should('contain.text', 'Ready');
    cy.get('[data-testid="cp-status-group-cluster"]').should('contain.text', 'Running');
    cy.get('[data-testid="cp-status-group-access"]').should('contain.text', 'Ready');
    cy.get('[data-testid="cp-status-group-services"]').should('contain.text', '1 service ready');
    cy.get('[data-testid="cp-status-group-platform"]').should('not.exist');
  });

  it('derives "Attention needed" from a problem reason hidden behind Progressing', () => {
    mount({
      phase: 'Progressing',
      conditions: [
        ...healthyConditions.filter((c) => c.type !== 'AccessReady.oidc_openmcp'),
        cond('AccessReady.oidc_github', 'False', 'ConfigurationProblem', 'issuer unreachable'),
      ],
    });

    openPopover();
    cy.get('[data-testid="cp-status-state"]').should('have.text', 'Attention needed');
    cy.get('[data-testid="cp-status-headline"]').should('contain.text', 'Access to your control plane');
    cy.get('[data-testid="cp-status-headline-detail"]').should('have.text', 'issuer unreachable');
    cy.get('[data-testid="cp-status-item-AccessReady.oidc_github"]').should('contain.text', 'Identity provider github');
  });

  it('shows deletion steps while terminating', () => {
    mount({
      phase: 'Terminating',
      deletionTimestamp: '2026-10-26T08:00:00Z',
      conditions: [cond('AllServicesDeleted', 'False', 'WaitingForServiceDeletion', 'Waiting for: flux')],
    });

    openPopover();
    cy.get('[data-testid="cp-status-state"]').should('have.text', 'Deleting');
    cy.get('[data-testid="cp-status-group-deletion"]').should('contain.text', 'Remove services');
    cy.get('[data-testid="cp-status-group-cluster"]').should('not.exist');
  });

  it('keeps raw conditions in collapsed technical details, failing ones first', () => {
    mount({
      phase: 'Progressing',
      conditions: [...healthyConditions, cond('Cluster.ShootManagement', 'False', 'ShootNotFound', 'shoot gone')],
    });

    openPopover();
    cy.get('[data-testid="cp-status-technical-details"]')
      .should('contain.text', 'Technical details (7 conditions)')
      .and('have.attr', 'aria-expanded', 'false');
    cy.get('[data-testid="cp-status-technical-details-body"]').should('not.exist');

    cy.get('[data-testid="cp-status-technical-details"]').click();
    cy.get('[data-testid="cp-status-technical-details"]').should('have.attr', 'aria-expanded', 'true');
    cy.get('[data-testid="cp-status-technical-details-body"] li')
      .first()
      .should('contain.text', 'Cluster.ShootManagement')
      .and('contain.text', 'ShootNotFound')
      .and('contain.text', 'shoot gone');
  });

  it('puts the human-readable summary into the support ticket', () => {
    mount({
      phase: 'Progressing',
      conditions: [cond('ClusterRequestReady', 'False', 'WaitingForClusterRequest', 'not ready yet')],
    });

    openPopover();
    cy.get('a[href*="1-mcp_issue.yml"]')
      .invoke('attr', 'href')
      .then((href) => {
        const params = new URL(href as string).searchParams;
        expect(params.get('title')).to.contain('stuck in setup');
        expect(params.get('what-happened')).to.contain('Summary: Setting up');
        expect(params.get('what-happened')).to.contain('ClusterRequestReady: False');
      });
  });
});
