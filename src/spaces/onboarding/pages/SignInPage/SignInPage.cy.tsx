import { SignInPage } from './SignInPage.tsx';
import { useAuthOnboarding } from '../../auth/AuthContextOnboarding.tsx';
import { useLink } from '../../../../lib/shared/useLink.ts'; // if useLink relies on router

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
    cy.mount(<SignInPage useAuthOnboarding={fakeUseAuthOnboarding} />);

    cy.get('ui5-title').should('exist');
  });

  it('calls the login function when the user clicks the "Sign In" button', () => {
    cy.mount(<SignInPage useAuthOnboarding={fakeUseAuthOnboarding} />);

    cy.wrap(null).then(() => {
      expect(logInCalled).to.equal(false);
    });

    cy.get('ui5-button').eq(0).should('contain', 'Sign In').click();

    cy.wrap(null).then(() => {
      expect(logInCalled).to.equal(true);
    });
  });

  it('contains a link to the documentation', () => {
    const fakeUseLink = (() => ({
      documentationHomepage: 'https://link-to-documentation.com',
    })) as typeof useLink;

    cy.mount(<SignInPage useAuthOnboarding={fakeUseAuthOnboarding} useLink={fakeUseLink} />);

    cy.get('a')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noreferrer')
      .and('have.attr', 'href', 'https://link-to-documentation.com');
  });
});
