import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';
import { NotFoundBanner } from './NotFoundBanner.tsx';
import { MemoryRouter } from 'react-router-dom';

describe('<NotFoundBanner />', () => {
  it('renders title and subtitle interpolating the entityType', () => {
    cy.mount(
      <MemoryRouter>
        <NotFoundBanner entityType="%entityType%" />
      </MemoryRouter>,
    );

    cy.contains('%entityType% not found').should('be.visible');
    cy.contains('Sorry, we couldn’t find what you are looking for').should('be.visible');

    cy.get('ui5-button').contains('Back to Homepage');
  });
});
