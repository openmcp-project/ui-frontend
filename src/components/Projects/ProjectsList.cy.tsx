import '@ui5/webcomponents-cypress-commands';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { useProjectsQuery as _useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery';
import ProjectsList from './ProjectsList';

const projects = ['alpha-project', 'beta-project', 'gamma-project'];

const fakeUseProjectsQuery: typeof _useProjectsQuery = () => ({
  data: projects,
  isLoading: false,
  error: null,
  refetch: () => Promise.resolve([] as string[]),
});

const fakeUseProjectMembers: typeof _useProjectMembers = (projectName: string) => ({
  members: [],
  displayName:
    projectName === 'alpha-project'
      ? 'Alpha Display'
      : projectName === 'beta-project'
        ? 'Beta Display'
        : 'Gamma Display',
  creationTimestamp: '2024-01-01T00:00:00Z',
  isLoading: false,
});

const mount = () =>
  cy.mount(<ProjectsList useProjectsQuery={fakeUseProjectsQuery} useProjectMembers={fakeUseProjectMembers} />);

describe('ProjectsList search', () => {
  it('shows all projects when search is empty', () => {
    mount();
    cy.contains('alpha-project').should('exist');
    cy.contains('beta-project').should('exist');
    cy.contains('gamma-project').should('exist');
  });

  it('filters by project name', () => {
    mount();
    cy.get('ui5-input').typeIntoUi5Input('alpha');
    cy.contains('alpha-project').should('exist');
    cy.contains('beta-project').should('not.exist');
    cy.contains('gamma-project').should('not.exist');
  });

  it('filters by display name', () => {
    mount();
    cy.get('ui5-input').typeIntoUi5Input('Beta Display');
    cy.contains('beta-project').should('exist');
    cy.contains('alpha-project').should('not.exist');
    cy.contains('gamma-project').should('not.exist');
  });

  it('is case-insensitive', () => {
    mount();
    cy.get('ui5-input').typeIntoUi5Input('GAMMA');
    cy.contains('gamma-project').should('exist');
    cy.contains('alpha-project').should('not.exist');
  });

  it('shows no results for unmatched query', () => {
    mount();
    cy.get('ui5-input').typeIntoUi5Input('zzznomatch');
    cy.contains('alpha-project').should('not.exist');
    cy.contains('beta-project').should('not.exist');
    cy.contains('gamma-project').should('not.exist');
  });
});
