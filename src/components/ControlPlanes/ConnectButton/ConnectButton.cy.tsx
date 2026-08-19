import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import ConnectButton from './ConnectButton';
import { GET_KUBECONFIG_QUERY } from '../../../spaces/onboarding/hooks/useKubeconfigQuery.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import '@ui5/webcomponents-cypress-commands';

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

function kubeconfigMock(contexts: { user: string }[]) {
  return [
    {
      request: {
        query: GET_KUBECONFIG_QUERY,
        variables: { kubeConfigName: 'my-secret', namespaceName: 'my-namespace' },
      },
      result: {
        data: {
          v1: {
            Secret: {
              data: { kubeconfig: btoa(generateKubeconfigYaml(contexts)) },
            },
          },
        },
      },
    },
  ];
}

describe('ConnectButton', () => {
  const defaultProps = {
    projectName: 'my-project',
    workspaceName: 'my-project--ws-my-workspace',
    controlPlaneName: 'my-mcp',
    secretName: 'my-secret',
    namespace: 'my-namespace',
    secretKey: 'kubeconfig',
  };

  it('is enabled on mount — does NOT fire GetKubeconfig until clicked', () => {
    let requestCount = 0;
    const mocks = kubeconfigMock([{ user: 'openmcp' }]).map((m) => ({
      ...m,
      result: () => {
        requestCount++;
        return m.result;
      },
    }));

    cy.mount(
      <MockedProvider mocks={mocks}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} />
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-button').should('not.have.attr', 'disabled');
    cy.wait(200).then(() => {
      expect(requestCount).to.equal(0);
    });
  });

  it('navigates directly when only the system IdP exists', () => {
    const navigateSpy = cy.stub().as('navigateSpy');
    const mockUseNavigate = () => navigateSpy;

    cy.mount(
      <MockedProvider mocks={kubeconfigMock([{ user: 'openmcp' }])}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} useNavigate={mockUseNavigate} />
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-button').click();

    cy.get('@navigateSpy').should('have.been.calledOnce');
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/projects/my-project/workspaces/my-workspace/managedcontrolplane/my-mcp',
    );
  });

  it('navigates directly when a single custom IdP exists', () => {
    const navigateSpy = cy.stub().as('navigateSpy');
    const mockUseNavigate = () => navigateSpy;

    cy.mount(
      <MockedProvider mocks={kubeconfigMock([{ user: 'custom-user' }])}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} useNavigate={mockUseNavigate} />
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-button').click();

    cy.get('@navigateSpy').should('have.been.calledOnce');
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/projects/my-project/workspaces/my-workspace/managedcontrolplane/my-mcp?idp=custom-user',
    );
  });

  it('shows a dropdown menu when multiple IdPs exist', () => {
    const navigateSpy = cy.stub().as('navigateSpy');
    const mockUseNavigate = () => navigateSpy;

    cy.mount(
      <MockedProvider mocks={kubeconfigMock([{ user: 'openmcp' }, { user: 'custom-user' }])}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} useNavigate={mockUseNavigate} />
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-button').click();

    cy.get('ui5-menu[open]').within(() => {
      cy.contains('openmcp').should('be.visible');
      cy.contains('custom-user').should('be.visible');
    });

    cy.get('ui5-menu-item').eq(0).click();
    cy.get('@navigateSpy').should('have.been.calledOnce');
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/projects/my-project/workspaces/my-workspace/managedcontrolplane/my-mcp',
    );

    cy.get('@navigateSpy').invoke('resetHistory');

    cy.get('ui5-button').click();
    cy.get('ui5-menu-item').eq(1).click();
    cy.get('@navigateSpy').should('have.been.calledOnce');
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/projects/my-project/workspaces/my-workspace/managedcontrolplane/my-mcp?idp=custom-user',
    );
  });

  it('is disabled when required props are missing', () => {
    cy.mount(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <ConnectButton {...defaultProps} secretKey="" />
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-button').should('have.attr', 'disabled');
  });

  describe('telemetry', () => {
    const mockUseTelemetryWith = (trackSpy: Cypress.Agent<sinon.SinonStub>): typeof useTelemetry => {
      return () => ({ track: trackSpy, report: cy.stub(), identify: cy.stub() });
    };

    it('tracks controlplane.connected with idp=system when connecting via system IdP', () => {
      const trackSpy = cy.stub().as('trackSpy');
      const mockUseNavigate = () => cy.stub();

      cy.mount(
        <MockedProvider mocks={kubeconfigMock([{ user: 'openmcp' }])}>
          <MemoryRouter>
            <ConnectButton
              {...defaultProps}
              useNavigate={mockUseNavigate}
              useTelemetry={mockUseTelemetryWith(trackSpy)}
            />
          </MemoryRouter>
        </MockedProvider>,
      );

      cy.get('ui5-button').click();

      cy.get('@trackSpy').should('have.been.calledOnce');
      cy.get('@trackSpy').should('have.been.calledWith', { name: 'controlplane.connected', idp: 'system' });
    });

    it('tracks controlplane.connected with idp=custom when connecting via custom IdP', () => {
      const trackSpy = cy.stub().as('trackSpy');
      const mockUseNavigate = () => cy.stub();

      cy.mount(
        <MockedProvider mocks={kubeconfigMock([{ user: 'custom-user' }])}>
          <MemoryRouter>
            <ConnectButton
              {...defaultProps}
              useNavigate={mockUseNavigate}
              useTelemetry={mockUseTelemetryWith(trackSpy)}
            />
          </MemoryRouter>
        </MockedProvider>,
      );

      cy.get('ui5-button').click();

      cy.get('@trackSpy').should('have.been.calledOnce');
      cy.get('@trackSpy').should('have.been.calledWith', { name: 'controlplane.connected', idp: 'custom' });
    });

    it('tracks the selected idp when picking from the menu with multiple IdPs', () => {
      const trackSpy = cy.stub().as('trackSpy');
      const mockUseNavigate = () => cy.stub();

      cy.mount(
        <MockedProvider mocks={kubeconfigMock([{ user: 'openmcp' }, { user: 'custom-user' }])}>
          <MemoryRouter>
            <ConnectButton
              {...defaultProps}
              useNavigate={mockUseNavigate}
              useTelemetry={mockUseTelemetryWith(trackSpy)}
            />
          </MemoryRouter>
        </MockedProvider>,
      );

      cy.get('ui5-button').click();
      cy.get('ui5-menu-item').eq(0).click();
      cy.get('@trackSpy').should('have.been.calledOnce');
      cy.get('@trackSpy').should('have.been.calledWith', { name: 'controlplane.connected', idp: 'system' });

      cy.get('ui5-button').click();
      cy.get('ui5-menu-item').eq(1).click();
      cy.get('@trackSpy').should('have.been.calledTwice');
      cy.get('@trackSpy').should('have.been.calledWith', { name: 'controlplane.connected', idp: 'custom' });
    });
  });
});
