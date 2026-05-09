import { ShellBarComponent } from './ShellBar.tsx';
import '@ui5/webcomponents-cypress-commands';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../context/ToastContext.tsx';

const mockAuth = {
  user: { email: 'test@example.com' },
  logout: cy.stub().resolves(),
};

describe('ShellBar', () => {
  beforeEach(() => {
    cy.stub(require('../../spaces/onboarding/auth/AuthContextOnboarding.tsx'), 'useAuthOnboarding').returns(mockAuth);
  });

  it('renders the ShellBar with logo and title', () => {
    cy.mount(
      <MemoryRouter>
        <ToastProvider>
          <ShellBarComponent />
        </ToastProvider>
      </MemoryRouter>,
    );

    cy.contains('ManagedControlPlane UI').should('be.visible');
    cy.get('img[alt="SAP"]').should('be.visible');
  });

  it('renders preview badge in content slot', () => {
    cy.mount(
      <MemoryRouter>
        <ToastProvider>
          <ShellBarComponent />
        </ToastProvider>
      </MemoryRouter>,
    );

    cy.contains('PREVIEW').should('be.visible');
    cy.get('[slot="content"]').contains('PREVIEW').should('exist');
  });

  it('opens profile menu on avatar click', () => {
    cy.mount(
      <MemoryRouter>
        <ToastProvider>
          <ShellBarComponent />
        </ToastProvider>
      </MemoryRouter>,
    );

    cy.get('ui5-avatar').click();
    cy.get('ui5-popover[header-text="Profile"]').should('have.attr', 'open', 'true');
  });

  it('shows feedback and sign out options in profile menu', () => {
    cy.mount(
      <MemoryRouter>
        <ToastProvider>
          <ShellBarComponent />
        </ToastProvider>
      </MemoryRouter>,
    );

    cy.get('ui5-avatar').click();
    cy.contains('Give us your feedback').should('be.visible');
    cy.contains('Sign Out').should('be.visible');
  });

  it('calls logout when sign out is clicked', () => {
    cy.mount(
      <MemoryRouter>
        <ToastProvider>
          <ShellBarComponent />
        </ToastProvider>
      </MemoryRouter>,
    );

    cy.get('ui5-avatar').click();
    cy.contains('Sign Out').click({ force: true });

    cy.then(() => {
      expect(mockAuth.logout).to.have.been.called;
    });
  });

  it('opens feedback popover when feedback menu item is clicked', () => {
    cy.mount(
      <MemoryRouter>
        <ToastProvider>
          <ShellBarComponent />
        </ToastProvider>
      </MemoryRouter>,
    );

    cy.get('ui5-avatar').click();
    cy.contains('Give us your feedback').click({ force: true });
    cy.contains('Your feedback').should('be.visible');
  });

  it('opens beta popover when preview badge is clicked', () => {
    cy.mount(
      <MemoryRouter>
        <ToastProvider>
          <ShellBarComponent />
        </ToastProvider>
      </MemoryRouter>,
    );

    cy.contains('PREVIEW').click();
    cy.contains('in Preview').should('be.visible');
  });
});
