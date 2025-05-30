import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { IllustratedBanner } from './IllustratedBanner';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

describe('<IllustratedBanner />', () => {
  it('renders title and subtitle', () => {
    cy.mount(
      <IllustratedBanner
        title="Test title"
        subtitle="Test subtitle"
        illustrationName={IllustrationMessageType.NoData}
      />,
    );

    cy.contains('Test title').should('be.visible');
    cy.contains('Test subtitle').should('be.visible');
  });

  it('renders help button with correct text and icon', () => {
    cy.mount(
      <IllustratedBanner
        title="With Help"
        subtitle="Subtitle"
        illustrationName={IllustrationMessageType.NoData}
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

  it('renders a link with correct attributes', () => {
    cy.mount(
      <IllustratedBanner
        title="Click Test"
        subtitle="Check link attributes"
        illustrationName={IllustrationMessageType.NoData}
        help={{
          link: 'https://example.com',
          buttonText: 'Go',
        }}
      />,
    );

    cy.get('a')
      .should('have.attr', 'href', 'https://example.com')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noreferrer');

    cy.get('a').contains('Go');
  });
});
