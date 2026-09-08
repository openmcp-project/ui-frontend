import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';
import { NotFoundBanner } from './NotFoundBanner.tsx';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

describe('<NotFoundBanner />', () => {
  it('renders title and subtitle interpolating the entityType', () => {
    cy.mount(
      <MemoryRouter>
        <NotFoundBanner entityType="%entityType%" />
      </MemoryRouter>,
    );

    cy.contains('%entityType% not found').should('be.visible');
    cy.get('ui5-button').contains('Back to Homepage');
  });

  it('navigates to homePath when Back to Homepage is clicked', () => {
    cy.mount(
      <MemoryRouter initialEntries={['/not-found']}>
        <Routes>
          <Route
            path="/not-found"
            element={<NotFoundBanner entityType="Project" homePath="/projects?noRedirect=true" />}
          />
          <Route path="/projects" element={<div data-testid="projects-page" />} />
        </Routes>
      </MemoryRouter>,
    );

    cy.get('ui5-button').contains('Back to Homepage').click();
    cy.get('[data-testid="projects-page"]').should('exist');
  });
});
