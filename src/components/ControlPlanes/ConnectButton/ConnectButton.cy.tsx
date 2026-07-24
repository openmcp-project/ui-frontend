import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import ConnectButton from './ConnectButton';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import '@ui5/webcomponents-cypress-commands';
import { GET_KUBECONFIG_QUERY } from '../../../spaces/onboarding/hooks/useKubeconfigQuery.ts';

const generateKubeconfigYaml = (contexts: { user: string }[]) => `
apiVersion: v1
kind: Config
contexts:
${contexts
  .map(
    (c) => `
- name: ctx-${c.user}
  context:
    user: ${c.user}
    cluster: test-cluster
`,
  )
  .join('')}
`;

const btoa64 = (str: string) => btoa(str);

const defaultProps = {
  projectName: 'my-project',
  workspaceName: 'my-project--ws-my-workspace',
  controlPlaneName: 'my-mcp',
  secretName: 'my-secret',
  namespace: 'my-namespace',
  secretKey: 'kubeconfig',
};

function kubeconfigMock(contexts: { user: string }[], delay = 0) {
  return {
    request: {
      query: GET_KUBECONFIG_QUERY,
      variables: { kubeConfigName: 'my-secret', namespaceName: 'my-namespace' },
    },
    ...(delay ? { delay } : {}),
    result: {
      data: {
        v1: {
          Secret: {
            data: { kubeconfig: btoa64(generateKubeconfigYaml(contexts)) },
          },
        },
      },
    },
  };
}

describe('ConnectButton', () => {
  it('does NOT fire GetKubeconfig on mount — only fires after click', () => {
    let requestCount = 0;
    cy.intercept('POST', '**/graphql', (req) => {
      const body = req.body as { operationName?: string };
      if (body.operationName === 'GetKubeconfig') requestCount++;
      req.continue();
    }).as('graphql');

    cy.mount(
      <MockedProvider mocks={[kubeconfigMock([{ user: 'openmcp' }])]}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} useNavigate={() => cy.stub()} />
        </MemoryRouter>
      </MockedProvider>,
    );

    // Wait a tick to confirm no request was fired on mount
    cy.wait(200);
    cy.then(() => expect(requestCount).to.equal(0));

    // Now click — expect exactly one request
    cy.get('ui5-button[data-testid="connect-button"]').click();
    cy.then(() => expect(requestCount).to.equal(1));
  });

  it('renders enabled before any fetch', () => {
    cy.mount(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} />
        </MemoryRouter>
      </MockedProvider>,
    );
    cy.get('ui5-button[data-testid="connect-button"]').should('not.have.attr', 'disabled');
  });

  it('shows disabled (loading) while kubeconfig is fetching', () => {
    cy.mount(
      <MockedProvider mocks={[kubeconfigMock([{ user: 'openmcp' }], 60000)]}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} />
        </MemoryRouter>
      </MockedProvider>,
    );
    cy.get('ui5-button[data-testid="connect-button"]').click();
    cy.get('ui5-button[data-testid="connect-button"]').should('have.attr', 'disabled');
  });

  it('navigates directly when only the system IdP exists', () => {
    const navigateSpy = cy.stub().as('navigateSpy');

    cy.mount(
      <MockedProvider mocks={[kubeconfigMock([{ user: 'openmcp' }])]}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} useNavigate={() => navigateSpy} />
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-button[data-testid="connect-button"]').click();
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/projects/my-project/workspaces/my-workspace/managedcontrolplane/my-mcp',
    );
  });

  it('navigates directly when a single custom IdP exists', () => {
    const navigateSpy = cy.stub().as('navigateSpy');

    cy.mount(
      <MockedProvider mocks={[kubeconfigMock([{ user: 'custom-user' }])]}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} useNavigate={() => navigateSpy} />
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-button[data-testid="connect-button"]').click();
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/projects/my-project/workspaces/my-workspace/managedcontrolplane/my-mcp?idp=custom-user',
    );
  });

  it('opens dropdown menu when multiple IdPs exist', () => {
    const navigateSpy = cy.stub().as('navigateSpy');

    cy.mount(
      <MockedProvider mocks={[kubeconfigMock([{ user: 'openmcp' }, { user: 'custom-user' }])]}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} useNavigate={() => navigateSpy} />
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-button[data-testid="connect-button"]').click();
    cy.get('ui5-menu[open]').within(() => {
      cy.contains('openmcp').should('be.visible');
      cy.contains('custom-user').should('be.visible');
    });

    cy.get('ui5-menu-item').eq(0).click();
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/projects/my-project/workspaces/my-workspace/managedcontrolplane/my-mcp',
    );
  });

  describe('telemetry', () => {
    const mockUseTelemetryWith = (trackSpy: Cypress.Agent<sinon.SinonStub>): typeof useTelemetry => {
      return () => ({ track: trackSpy, report: cy.stub(), identify: cy.stub() });
    };

    it('tracks controlplane.connected with idp=system when connecting via system IdP', () => {
      const trackSpy = cy.stub().as('trackSpy');

      cy.mount(
        <MockedProvider mocks={[kubeconfigMock([{ user: 'openmcp' }])]}>
          <MemoryRouter>
            <ConnectButton
              {...defaultProps}
              useNavigate={() => cy.stub()}
              useTelemetry={mockUseTelemetryWith(trackSpy)}
            />
          </MemoryRouter>
        </MockedProvider>,
      );

      cy.get('ui5-button[data-testid="connect-button"]').click();
      cy.get('@trackSpy').should('have.been.calledWith', { name: 'controlplane.connected', idp: 'system' });
    });

    it('tracks controlplane.connected with idp=custom when connecting via custom IdP', () => {
      const trackSpy = cy.stub().as('trackSpy');

      cy.mount(
        <MockedProvider mocks={[kubeconfigMock([{ user: 'custom-user' }])]}>
          <MemoryRouter>
            <ConnectButton
              {...defaultProps}
              useNavigate={() => cy.stub()}
              useTelemetry={mockUseTelemetryWith(trackSpy)}
            />
          </MemoryRouter>
        </MockedProvider>,
      );

      cy.get('ui5-button[data-testid="connect-button"]').click();
      cy.get('@trackSpy').should('have.been.calledWith', { name: 'controlplane.connected', idp: 'custom' });
    });
  });
});
