import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { useProjectsQuery as _useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery.ts';
import ProjectChooser from './ProjectChooser.tsx';

const fakeUseProjectsQuery: typeof _useProjectsQuery = () => ({
  data: ['alpha-project', 'beta-project', 'gamma-project'],
  isLoading: false,
  error: null,
  refetch: () => Promise.resolve([] as string[]),
});

const fakeUseProjectsQueryError: typeof _useProjectsQuery = () => ({
  data: [],
  isLoading: false,
  error: new Error('Failed to load projects'),
  refetch: () => Promise.resolve([] as string[]),
});

function mount(currentProjectName: string, hook: typeof _useProjectsQuery = fakeUseProjectsQuery) {
  cy.mount(
    <MockedProvider mocks={[]}>
      <MemoryRouter>
        <ProjectChooser currentProjectName={currentProjectName} useProjectsQuery={hook} />
      </MemoryRouter>
    </MockedProvider>,
  );
}

describe('ProjectChooser', () => {
  it('renders an option for each project returned by the hook', () => {
    mount('alpha-project');

    cy.get('ui5-variant-item').should('have.length', 3);
    cy.contains('alpha-project').should('exist');
    cy.contains('beta-project').should('exist');
    cy.contains('gamma-project').should('exist');
  });

  it('marks the current project as selected', () => {
    mount('beta-project');

    cy.get('ui5-variant-item[selected]').should('have.length', 1);
    cy.get('ui5-variant-item[selected]').should('have.text', 'beta-project');
  });

  it('shows an error when the hook returns an error', () => {
    mount('alpha-project', fakeUseProjectsQueryError);

    cy.get('ui5-illustrated-message').should('exist');
    cy.contains('Failed to load projects').should('exist');
  });
});
