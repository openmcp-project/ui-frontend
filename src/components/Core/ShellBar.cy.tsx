import '@ui5/webcomponents-cypress-commands';
import { MemoryRouter } from 'react-router-dom';
import { ShellBarMcpActionsProvider } from '../../context/ShellBarMcpActionsContext.tsx';
import { ToastProvider } from '../../context/ToastContext.tsx';
import { ViewModeProvider } from '../../context/ViewModeContext.tsx';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { clearRememberedProject, setRememberedProject } from '../../utils/rememberedProject.ts';
import { ShellBarComponent } from './ShellBar.tsx';
import { FrontendConfigContext } from '../../context/FrontendConfigContext.tsx';

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
    // Reset remembered-project state so a test that pins a project doesn't
    // leak that state into the next test's mount.
    clearRememberedProject();
  });

  const mountComponent = ({ enableHeadlamp = true }: { enableHeadlamp?: boolean } = {}) => {
    const fakeConfig = {
      landscape: undefined,
      documentationBaseUrl: '',
      githubBaseUrl: '',
      mcp2DocsUrl: '',
      featureToggles: { markMcpV1asDeprecated: false, enableMcpV2: false, enableHeadlamp },
    };
    cy.mount(
      <MemoryRouter>
        <FrontendConfigContext.Provider value={fakeConfig}>
          <ToastProvider>
            <ViewModeProvider>
              <ShellBarMcpActionsProvider>
                <ShellBarComponent useAuthOnboarding={fakeUseAuthOnboarding} />
              </ShellBarMcpActionsProvider>
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

  it('shows avatar with user initials', () => {
    mountComponent();

    cy.get('ui5-avatar').should('exist');
  });

  it('opens profile popover on avatar click', () => {
    mountComponent();

    cy.get('ui5-avatar').click();

    cy.get('ui5-popover[header-text="Profile"]', { timeout: 5000 }).should('be.visible');
  });

  it('shows sign out option in profile menu', () => {
    mountComponent();

    cy.get('ui5-avatar').click();

    cy.get('ui5-popover[header-text="Profile"]').within(() => {
      cy.contains('Sign Out').should('exist');
    });
  });

  it('calls logout when sign out is clicked', () => {
    mountComponent();

    cy.get('ui5-avatar').click();
    cy.contains('Sign Out').clickEnabled();

    cy.wrap(null).should(() => {
      expect(logoutCalled).to.equal(true);
    });
  });

  it('does not show clear remembered project when no project is stored', () => {
    cy.wrap(null).then(() => clearRememberedProject());
    mountComponent();

    cy.get('ui5-avatar').click();
    cy.get('ui5-popover[header-text="Profile"]').within(() => {
      cy.contains('Clear remembered project').should('not.exist');
    });
  });

  it('shows clear remembered project when a project is stored', () => {
    cy.wrap(null).then(() => setRememberedProject('my-project'));
    mountComponent();

    cy.get('ui5-avatar').click();
    cy.get('ui5-popover[header-text="Profile"]').within(() => {
      cy.contains('Clear remembered project').should('exist');
    });

    cy.wrap(null).then(() => clearRememberedProject());
  });

  it('clears remembered project when clear item is clicked', () => {
    cy.wrap(null).then(() => setRememberedProject('my-project'));
    mountComponent();

    cy.get('ui5-avatar').click();
    cy.contains('Clear remembered project').clickEnabled();

    cy.wrap(null).should(() => {
      expect(localStorage.getItem('rememberedProject')).to.equal(null);
    });
  });
});
