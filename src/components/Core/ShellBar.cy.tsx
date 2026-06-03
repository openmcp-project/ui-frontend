import { ShellBarComponent } from './ShellBar.tsx';
import '@ui5/webcomponents-cypress-commands';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../context/ToastContext.tsx';
import { useAuthOnboarding } from '../../spaces/onboarding/auth/AuthContextOnboarding.tsx';

describe('ShellBar', () => {
  let logoutCalled = false;

  const fakeUseAuthOnboarding: typeof useAuthOnboarding = () => ({
    user: { email: 'test@example.com' },
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

  const mountComponent = () => {
    cy.mount(
      <MemoryRouter>
        <ToastProvider>
          <ShellBarComponent useAuthOnboarding={fakeUseAuthOnboarding} />
        </ToastProvider>
      </MemoryRouter>,
    );
  };

  it('renders the ShellBar with logo and title', () => {
    mountComponent();

    cy.contains('ManagedControlPlane UI').should('be.visible');
    cy.get('img[alt="SAP"]').should('be.visible');
  });

  it('renders beta badge', () => {
    mountComponent();

    cy.contains('Beta').should('be.visible');
  });

  it('shows avatar with user initials', () => {
    mountComponent();

    cy.get('ui5-avatar').should('exist');
  });

  it('opens profile popover on avatar click', () => {
    mountComponent();

    cy.get('ui5-avatar').click();

    // Wait for popover to open
    cy.get('ui5-popover[header-text="Profile"]', { timeout: 5000 }).should('be.visible');
  });

  it('shows sign out option in profile menu', () => {
    mountComponent();

    cy.get('ui5-avatar').click();

    // Check for Sign Out within the popover
    cy.get('ui5-popover[header-text="Profile"]').within(() => {
      cy.contains('Sign Out').should('exist');
    });
  });

  it('calls logout when sign out is clicked', () => {
    mountComponent();

    cy.get('ui5-avatar').click();
    cy.contains('Sign Out').click({ force: true });

    // Verify logout was called
    cy.wrap(null).should(() => {
      expect(logoutCalled).to.equal(true);
    });
  });
});
