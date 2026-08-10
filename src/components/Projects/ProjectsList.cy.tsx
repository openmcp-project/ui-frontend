import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { SplitterProvider } from '../Splitter/SplitterContext.tsx';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { useProjectsQuery as _useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery';
import { clearRememberedProject, getRememberedProject } from '../../utils/rememberedProject.ts';
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
  createdBy: undefined,
  chargingTarget: undefined,
  chargingTargetType: undefined,
  creationTimestamp: '2024-01-01T00:00:00Z',
  isLoading: false,
  supportLandscape: undefined,
  supportServiceIds: undefined,
  supportSecurityContacts: undefined,
  supportOpsContacts: undefined,
});

const mount = (onProjectSelect?: (name: string) => void) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <MemoryRouter>
        <SplitterProvider>
          <ProjectsList
            useProjectsQuery={fakeUseProjectsQuery}
            useProjectMembers={fakeUseProjectMembers}
            onProjectSelect={onProjectSelect}
          />
        </SplitterProvider>
      </MemoryRouter>
    </MockedProvider>,
  );

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

describe('ProjectsList', () => {
  beforeEach(() => {
    clearRememberedProject();
  });

  it('renders project names from the query', () => {
    mount();

    // Cards show displayName as title when set; mock returns 'Alpha Display', 'Beta Display', etc.
    cy.get('[class*="titleRow"]').first().find('span').first().should('be.visible').and('contain.text', 'Alpha Display');
    cy.get('[class*="titleRow"]').eq(1).find('span').first().should('be.visible').and('contain.text', 'Beta Display');
  });

  it('calls onProjectSelect with the project name when a row is clicked', () => {
    const onSelect = cy.stub();
    mount(onSelect);

    cy.contains('alpha-project').click();

    cy.wrap(onSelect).should('have.been.calledOnceWith', 'alpha-project');
  });

  it('does not call onProjectSelect when prop is not provided', () => {
    mount(undefined);

    // clicking should not throw; just navigate
    cy.contains('alpha-project').click();
  });

  it('stores the project in localStorage when onProjectSelect writes it', () => {
    mount((name) => {
      localStorage.setItem('rememberedProject', name);
    });

    cy.contains('beta-project').click();

    cy.wrap(null).should(() => {
      expect(getRememberedProject()).to.equal('beta-project');
    });
  });
});

const mountWithParams = (search: string, onProjectSelect?: (name: string) => void) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <MemoryRouter initialEntries={[search]}>
        <SplitterProvider>
          <ProjectsList
            useProjectsQuery={fakeUseProjectsQuery}
            useProjectMembers={fakeUseProjectMembers}
            onProjectSelect={onProjectSelect}
          />
        </SplitterProvider>
      </MemoryRouter>
    </MockedProvider>,
  );

describe('ProjectsList URL params', () => {
  it('?sort=name-desc renders projects with sort button label "Z to A"', () => {
    mountWithParams('/?sort=name-desc');
    cy.get('ui5-button').contains('Z to A').should('exist');
  });

  it('?group=purpose activates grouped view with group button label "Purpose"', () => {
    mountWithParams('/?group=purpose');
    cy.get('ui5-button').contains('Purpose').should('exist');
  });

  it('unknown ?sort param falls back to default "A to Z"', () => {
    mountWithParams('/?sort=bogus');
    cy.get('ui5-button').contains('A to Z').should('exist');
  });

  it('unknown ?group param falls back to none "All"', () => {
    mountWithParams('/?group=bogus');
    cy.get('ui5-button').contains('All').should('exist');
  });
});
