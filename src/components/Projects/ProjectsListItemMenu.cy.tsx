import { ProjectsListItemMenu } from './ProjectsListItemMenu.tsx';
import { useDeleteProject } from '../../hooks/useDeleteProject.ts';
import '@ui5/webcomponents-cypress-commands';

describe('ProjectsListItemMenu', () => {
  let deleteProjectCalled = false;

  const fakeUseDeleteProject: typeof useDeleteProject = () => ({
    deleteProject: async (): Promise<void> => {
      deleteProjectCalled = true;
    },
  });

  beforeEach(() => {
    deleteProjectCalled = false;
  });

  it('deletes the project', () => {
    const projectName = 'test-project';

    cy.mount(<ProjectsListItemMenu projectName={projectName} useDeleteProject={fakeUseDeleteProject} />);

    // Open overflow menu
    cy.get('ui5-button[icon="overflow"]').click();

    // Click delete option
    cy.contains('Delete project').click({ force: true });

    // Type confirmation text
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input(projectName);

    // Verify delete not called yet
    cy.then(() => cy.wrap(deleteProjectCalled).should('equal', false));

    // Click delete button
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();

    // Verify delete was called
    cy.then(() => cy.wrap(deleteProjectCalled).should('equal', true));
  });
});
