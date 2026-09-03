import '@ui5/webcomponents-cypress-commands';
import { MemoryRouter } from 'react-router-dom';
import { useProjectsQuery as _useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery.ts';
import ProjectChooser from './ProjectChooser.tsx';

const fakeUseProjectsQuery: typeof _useProjectsQuery = () => ({
  data: ['alpha-project', 'beta-project', 'gamma-project'],
  isPending: false,
  error: null,
  refetch: () => Promise.resolve([] as string[]),
});

const fakeUseProjectsQueryError: typeof _useProjectsQuery = () => ({
  data: [],
  isPending: false,
  error: new Error('Failed to load projects'),
  refetch: () => Promise.resolve([] as string[]),
});

function mount(currentProjectName: string, hook: typeof _useProjectsQuery = fakeUseProjectsQuery) {
  cy.mount(
    <MemoryRouter>
      <ProjectChooser currentProjectName={currentProjectName} useProjectsQuery={hook} />
    </MemoryRouter>,
  );
}

describe('ProjectChooser', () => {
  it('shows the current project name on the button', () => {
    mount('beta-project');

    cy.get('[data-component-name="VariantManagementTitle"]').should('contain.text', 'beta-project');
  });

  it('opens the dropdown and shows all project options', () => {
    mount('alpha-project');

    cy.get('[data-component-name="VariantManagementTitle"]').click();

    cy.contains('alpha-project').should('exist');
    cy.contains('beta-project').should('exist');
    cy.contains('gamma-project').should('exist');
  });

  it('shows an error when the hook returns an error', () => {
    mount('alpha-project', fakeUseProjectsQueryError);

    cy.get('ui5-illustrated-message').should('exist');
    cy.contains('Failed to load projects').should('exist');
  });
});
