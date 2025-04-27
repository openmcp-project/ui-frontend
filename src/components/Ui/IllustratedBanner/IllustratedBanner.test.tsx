import { IllustratedBanner } from './IllustratedBanner';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

describe('<IllustratedBanner />', () => {
  it('renders title and subtitle', () => {
    cy.mount(<IllustratedBanner title="Test title" subtitle="Test subtitle" />);

    cy.contains('Test title').should('be.visible');
    cy.contains('Test subtitle').should('be.visible');
  });

  it('renders help button with correct text and icon', () => {
    cy.mount(
      <IllustratedBanner
        title="With Help"
        subtitle="Subtitle"
        help={{
          link: 'https://example.com',
          buttonText: 'Need Help?',
        }}
      />,
    );

    cy.get('ui5-button').contains('Need Help?').should('be.visible');
    cy.get('ui5-button').should(
      'have.attr',
      'icon',
      'sap-icon://question-mark',
    );
  });

  it('opens a new tab when button is clicked', () => {
    // Stub window.open
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    cy.mount(
      <IllustratedBanner
        title="Click Test"
        subtitle="Check window.open"
        help={{
          link: 'https://example.com',
          buttonText: 'Go',
        }}
      />,
    );

    cy.get('ui5-button').contains('Go').click();
    cy.get('@windowOpen').should(
      'have.been.calledWith',
      'https://example.com',
      '_blank',
    );
  });
});
