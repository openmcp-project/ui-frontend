import { MemoryRouter } from 'react-router-dom';
import ConnectButton from './ConnectButton';
import { useApiResource } from '../../../lib/api/useApiResource.ts';
import '@ui5/webcomponents-cypress-commands';
import { APIError } from '../../../lib/api/error.ts';

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

describe('ConnectButton', () => {
  const defaultProps = {
    projectName: 'my-project',
    workspaceName: 'my-project--ws-my-workspace',
    controlPlaneName: 'my-mcp',
    secretName: 'my-secret',
    namespace: 'my-namespace',
    secretKey: 'kubeconfig',
  };

  it('renders in disabled loading state', () => {
    const useApiResourceMockLoading: typeof useApiResource = () => {
      return {
        data: undefined,
        error: undefined,
        isLoading: true, // < loading
        isValidating: false,
      };
    };

    cy.mount(
      <MemoryRouter>
        <ConnectButton {...defaultProps} useApiResource={useApiResourceMockLoading} />
      </MemoryRouter>,
    );

    cy.get('ui5-button').should('have.attr', 'disabled');
  });

  it('renders in error state', () => {
    const fakeUseApiResourceError: typeof useApiResource = () => {
      return {
        data: undefined,
        error: new APIError('Failed to load', 500), // < error
        isLoading: false,
        isValidating: false,
      };
    };

    cy.mount(
      <MemoryRouter>
        <ConnectButton {...defaultProps} useApiResource={fakeUseApiResourceError} />
      </MemoryRouter>,
    );

    cy.get('ui5-button').should('have.attr', 'disabled');
  });

  it('renders direct navigation button when only the system IdP exists', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeUseApiResourceSingle: typeof useApiResource = (): any => {
      return {
        data: generateKubeconfigYaml([{ user: 'openmcp' }]), // < system IdP
        error: undefined,
        isLoading: false,
      };
    };
    const navigateSpy = cy.stub().as('navigateSpy');
    const mockUseNavigate = () => navigateSpy;

    cy.mount(
      <MemoryRouter>
        <ConnectButton {...defaultProps} useApiResource={fakeUseApiResourceSingle} useNavigate={mockUseNavigate} />
      </MemoryRouter>,
    );

    cy.get('ui5-button').should('not.have.attr', 'disabled');
    cy.get('ui5-button').click();

    cy.get('@navigateSpy').should('have.been.calledOnce');
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/mcp/projects/my-project/workspaces/my-workspace/mcps/my-mcp',
    );
  });

  it('renders direct navigation button when a single custom IdP exists', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeUseApiResourceSingle: typeof useApiResource = (): any => {
      return {
        data: generateKubeconfigYaml([{ user: 'custom-user' }]), // < single custom IdP
        error: undefined,
        isLoading: false,
      };
    };
    const navigateSpy = cy.stub().as('navigateSpy');
    const mockUseNavigate = () => navigateSpy;

    cy.mount(
      <MemoryRouter>
        <ConnectButton {...defaultProps} useApiResource={fakeUseApiResourceSingle} useNavigate={mockUseNavigate} />
      </MemoryRouter>,
    );

    cy.get('ui5-button').should('not.have.attr', 'disabled');
    cy.get('ui5-button').click();

    cy.get('@navigateSpy').should('have.been.calledOnce');
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/mcp/projects/my-project/workspaces/my-workspace/mcps/my-mcp?idp=custom-user',
    );
  });

  it('renders dropdown menu when multiple IdPs exist', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeUseApiResourceMultiple: typeof useApiResource = (): any => {
      return {
        data: generateKubeconfigYaml([{ user: 'openmcp' }, { user: 'custom-user' }]), // < system IdP + custom IdP
        error: undefined,
        isLoading: false,
      };
    };

    const navigateSpy = cy.stub().as('navigateSpy');
    const mockUseNavigate = () => navigateSpy;

    cy.mount(
      <MemoryRouter>
        <ConnectButton {...defaultProps} useApiResource={fakeUseApiResourceMultiple} useNavigate={mockUseNavigate} />
      </MemoryRouter>,
    );

    cy.get('ui5-button').click();

    cy.get('ui5-menu[open]').within(() => {
      cy.contains('openmcp').should('be.visible');
      cy.contains('custom-user').should('be.visible');
      cy.contains('Download Kubeconfig').should('be.visible');
    });

    // First item: default IdP
    cy.get('ui5-menu-item').eq(0).click();
    cy.get('@navigateSpy').should('have.been.calledOnce');
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/mcp/projects/my-project/workspaces/my-workspace/mcps/my-mcp',
    );

    // Reset spy for next assertion
    cy.get('@navigateSpy').invoke('resetHistory');

    // Second item: custom IdP
    cy.get('ui5-button').click();
    cy.get('ui5-menu-item').eq(1).click();
    cy.get('@navigateSpy').should('have.been.calledOnce');
    cy.get('@navigateSpy').should(
      'have.been.calledWith',
      '/mcp/projects/my-project/workspaces/my-workspace/mcps/my-mcp?idp=custom-user',
    );
  });

  it('renders in disabled state when there are no IdPs', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const useApiResourceMockNoIdPs: typeof useApiResource = (): any => {
      return {
        data: generateKubeconfigYaml([]), // < no IdPs
        error: undefined,
        isLoading: false,
      };
    };

    cy.mount(
      <MemoryRouter>
        <ConnectButton {...defaultProps} useApiResource={useApiResourceMockNoIdPs} />
      </MemoryRouter>,
    );

    cy.get('ui5-button').should('have.attr', 'disabled');
  });
});
