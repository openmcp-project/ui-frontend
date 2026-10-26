import '@ui5/webcomponents-cypress-commands';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Routes } from '../../Routes.ts';
import { ShellBarMcpActionsProvider, useShellBarMcpActions } from '../../context/ShellBarMcpActionsContext.tsx';
import { ToastProvider } from '../../context/ToastContext.tsx';
import { ViewModeProvider } from '../../context/ViewModeContext.tsx';
import { YamlApplyContextProvider } from '../../context/YamlApplyContext.tsx';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { clearRememberedProject, setRememberedProject } from '../../utils/rememberedProject.ts';
import { ShellBarComponent } from './ShellBar.tsx';
import { FrontendConfigContext } from '../../context/FrontendConfigContext.tsx';

function McpActionsSetter({
  mcpName,
  onEditMcp,
  project,
  workspace,
  mcpStatus,
}: {
  mcpName: string;
  onEditMcp?: () => void;
  project?: string;
  workspace?: string;
  mcpStatus?: { status?: string | null };
}) {
  const { setMcpActions } = useShellBarMcpActions();
  useEffect(() => {
    setMcpActions({ mcpName, onEditMcp, project, workspace, mcpStatus });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

describe('ShellBar', () => {
  let logoutCalled = false;

  const fakeUseAuthOnboarding: typeof useAuthOnboarding = () => ({
    user: { sub: 'test@example.com', email: 'test@example.com' },
    logout: async () => {
      logoutCalled = true;
    },
    isPending: false,
    isAuthenticated: true,
    error: null,
    login: () => {},
  });

  beforeEach(() => {
    logoutCalled = false;
  });

  const mountComponent = ({
    enableHeadlamp = true,
    mcpName,
    onEditMcp,
    project,
    workspace,
    mcpStatus,
  }: {
    enableHeadlamp?: boolean;
    mcpName?: string;
    onEditMcp?: () => void;
    project?: string;
    workspace?: string;
    mcpStatus?: { status?: string | null };
  } = {}) => {
    const fakeConfig = {
      landscape: undefined,
      documentationBaseUrl: '',
      githubBaseUrl: '',
      mcp2DocsUrl: '',
      featureToggles: {
        markMcpV1asDeprecated: false,
        enableMcpV2: false,
        enableHeadlamp,
        showLandscaperCard: false,
      },
    };
    cy.mount(
      <MemoryRouter>
        <FrontendConfigContext.Provider value={fakeConfig}>
          <ToastProvider>
            <ViewModeProvider>
              <YamlApplyContextProvider>
                <ShellBarMcpActionsProvider>
                  {mcpName && (
                    <McpActionsSetter
                      mcpName={mcpName}
                      project={project}
                      workspace={workspace}
                      mcpStatus={mcpStatus}
                      onEditMcp={onEditMcp}
                    />
                  )}
                  <ShellBarComponent useAuthOnboarding={fakeUseAuthOnboarding} />
                </ShellBarMcpActionsProvider>
              </YamlApplyContextProvider>
            </ViewModeProvider>
          </ToastProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>,
    );
  };

  it('renders the ShellBar with logo and title', () => {
    mountComponent();

    cy.get('img[alt="SAP"]').should('be.visible');
    cy.contains('OpenControlPlane UI').should('be.visible');
  });

  it('navigates home when the logo is clicked', () => {
    mountComponent();

    cy.window().then((win) => {
      win.location.hash = '#/projects/some-project';
    });

    cy.get('ui5-shellbar').shadow().find('[data-ui5-stable="logo"]').click({ force: true });

    cy.window().its('location.hash').should('eq', `#${Routes.Home}`);
  });

  it('shows avatar with user initials', () => {
    mountComponent();

    cy.get('ui5-avatar').should('exist');
  });

  it('opens profile popover on avatar click', () => {
    mountComponent();

    cy.get('ui5-avatar').click();

    cy.get('ui5-popover[header-text="Hello, test"]', { timeout: 5000 }).should('be.visible');
  });

  it('shows sign out option in profile menu', () => {
    mountComponent();

    cy.get('ui5-avatar').click();

    cy.get('ui5-popover[header-text="Hello, test"]').within(() => {
      cy.contains('Sign Out').should('exist');
    });
  });

  it('calls logout when sign out is clicked', () => {
    mountComponent();

    cy.get('ui5-avatar').click();
    cy.contains('Sign Out').click({ force: true });

    cy.wrap(null).should(() => {
      expect(logoutCalled).to.equal(true);
    });
  });

  it('does not show clear remembered project when no project is stored', () => {
    cy.wrap(null).then(() => clearRememberedProject());
    mountComponent();

    cy.get('ui5-avatar').click();
    cy.get('ui5-popover[header-text="Hello, test"]').within(() => {
      cy.contains('Clear remembered project').should('not.exist');
    });
  });

  it('shows clear remembered project when a project is stored', () => {
    cy.wrap(null).then(() => setRememberedProject('my-project'));
    mountComponent();

    cy.get('ui5-avatar').click();
    cy.get('ui5-popover[header-text="Hello, test"]').within(() => {
      cy.contains('Clear remembered project').should('exist');
    });

    cy.wrap(null).then(() => clearRememberedProject());
  });

  it('clears remembered project when clear item is clicked', () => {
    cy.wrap(null).then(() => setRememberedProject('my-project'));
    mountComponent();

    cy.get('ui5-avatar').click();
    cy.contains('Clear remembered project').click({ force: true });

    cy.wrap(null).should(() => {
      expect(localStorage.getItem('rememberedProject')).to.equal(null);
    });
  });

  it('shows an edit button in the control plane info popover header when onEditMcp is set', () => {
    mountComponent({ mcpName: 'my-control-plane', onEditMcp: () => {} });

    cy.get('ui5-button[icon="information"]').click({ force: true });

    cy.get('ui5-popover').contains('my-control-plane').should('be.visible');
    cy.get('ui5-popover').find('ui5-button[icon="edit"]').should('exist');
  });

  it('does not show an edit button in the info popover when onEditMcp is not set', () => {
    mountComponent({ mcpName: 'my-control-plane' });

    cy.get('ui5-button[icon="information"]').click({ force: true });

    cy.get('ui5-popover').contains('my-control-plane').should('be.visible');
    cy.get('ui5-popover').find('ui5-button[icon="edit"]').should('not.exist');
  });

  it('calls onEditMcp and closes the popover when the edit button is clicked', () => {
    let editCalled = false;
    mountComponent({
      mcpName: 'my-control-plane',
      onEditMcp: () => {
        editCalled = true;
      },
    });

    cy.get('ui5-button[icon="information"]').click({ force: true });
    cy.get('ui5-popover').find('ui5-button[icon="edit"]').click({ force: true });

    cy.wrap(null).should(() => {
      expect(editCalled).to.equal(true);
    });
    cy.get('ui5-popover[open]').should('not.exist');
  });

  it('shows the status badge in the ShellBar when mcpName, mcpStatus, project and workspace are set', () => {
    mountComponent({
      mcpName: 'my-control-plane',
      project: 'my-project',
      workspace: 'my-workspace',
      mcpStatus: { status: 'Ready' },
    });

    cy.get('ui5-button[icon="information"]').should('be.visible');
    cy.get('[data-testid="mcp-health-button"]').should('be.visible');
  });

  it('does not show the status badge when project/workspace are missing', () => {
    mountComponent({
      mcpName: 'my-control-plane',
      mcpStatus: { status: 'Ready' },
    });

    cy.get('[data-testid="mcp-health-button"]').should('not.exist');
  });
});
