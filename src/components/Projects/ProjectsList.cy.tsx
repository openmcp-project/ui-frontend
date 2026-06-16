import ProjectsList from './ProjectsList.tsx';
import { useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery';
import '@ui5/webcomponents-cypress-commands';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing/react';
import { SplitterProvider } from '../Splitter/SplitterContext.tsx';
import { clearRememberedProject, getRememberedProject } from '../../utils/rememberedProject.ts';

const fakeUseProjectsQuery: typeof useProjectsQuery = () => ({
  data: ['project-alpha', 'project-beta'],
  isLoading: false,
  error: null,
  refetch: async () => [],
});

const mountList = (onProjectSelect?: (name: string) => void) => {
  cy.mount(
    <MemoryRouter>
      <MockedProvider mocks={[]} addTypename={false}>
        <SplitterProvider>
          <ProjectsList useProjectsQuery={fakeUseProjectsQuery} onProjectSelect={onProjectSelect} />
        </SplitterProvider>
      </MockedProvider>
    </MemoryRouter>,
  );
};

describe('ProjectsList', () => {
  beforeEach(() => {
    clearRememberedProject();
  });

  it('renders project names from the query', () => {
    mountList();

    cy.contains('project-alpha').should('be.visible');
    cy.contains('project-beta').should('be.visible');
  });

  it('calls onProjectSelect with the project name when a row is clicked', () => {
    const onSelect = cy.stub();
    mountList(onSelect);

    cy.contains('project-alpha').click();

    cy.wrap(onSelect).should('have.been.calledOnceWith', 'project-alpha');
  });

  it('does not call onProjectSelect when prop is not provided', () => {
    mountList(undefined);

    // clicking should not throw; just navigate
    cy.contains('project-alpha').click();
  });

  it('stores the project in localStorage when onProjectSelect writes it', () => {
    mountList((name) => {
      localStorage.setItem('rememberedProject', name);
    });

    cy.contains('project-beta').click();

    cy.wrap(null).should(() => {
      expect(getRememberedProject()).to.equal('project-beta');
    });
  });
});
