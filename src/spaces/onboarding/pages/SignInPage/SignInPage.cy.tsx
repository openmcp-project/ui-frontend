import { SignInPage } from './SignInPage.tsx';
import { useAuthOnboarding } from '../../auth/AuthContextOnboarding.tsx';
import { useLink } from '../../../../lib/shared/useLink.ts'; // if useLink relies on router
import { FrontendConfigContext, defaultBranding } from '../../../../context/FrontendConfigContext.tsx';

const frontendConfig = {
  documentationBaseUrl: '',
  feedbackUrl: null,
  githubBaseUrl: '',
  branding: defaultBranding,
  featureToggles: {
    markMcpV1asDeprecated: false,
    enableMcpV2: false,
    enableHeadlamp: false,
    showLandscaperCard: false,
  },
};

describe('SignInPage', () => {
  let logInCalled = false;
  const fakeUseAuthOnboarding = (() => ({
    login: () => {
      logInCalled = true;
    },
  })) as typeof useAuthOnboarding;

  beforeEach(() => {
    logInCalled = false;
  });

  it('renders the SignInPage', () => {
    cy.mount(
      <FrontendConfigContext.Provider value={frontendConfig}>
        <SignInPage useAuthOnboarding={fakeUseAuthOnboarding} />
      </FrontendConfigContext.Provider>,
    );

    cy.get('[data-testid="app-icon"]').should('exist');
    cy.get('ui5-button').should('contain', 'Sign In');
  });

  it('calls the login function when the user clicks the "Sign In" button', () => {
    cy.mount(
      <FrontendConfigContext.Provider value={frontendConfig}>
        <SignInPage useAuthOnboarding={fakeUseAuthOnboarding} />
      </FrontendConfigContext.Provider>,
    );

    cy.wrap(null).then(() => {
      expect(logInCalled).to.equal(false);
    });

    cy.get('ui5-button').eq(0).should('contain', 'Sign In').click();

    cy.wrap(null).then(() => {
      expect(logInCalled).to.equal(true);
    });
  });

  it('contains a link to contribute on GitHub', () => {
    const fakeUseLink = (() => ({
      contributeLink: 'https://github.com/openmcp-project',
    })) as typeof useLink;

    cy.mount(
      <FrontendConfigContext.Provider value={frontendConfig}>
        <SignInPage useAuthOnboarding={fakeUseAuthOnboarding} useLink={fakeUseLink} />
      </FrontendConfigContext.Provider>,
    );

    cy.get('a')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noreferrer')
      .and('have.attr', 'href', 'https://github.com/openmcp-project');
  });
});
