import '@ui5/webcomponents-cypress-commands';
import { MemberRoles } from '../../lib/api/types/shared/members.ts';
import { useDeleteProject } from '../../spaces/onboarding/hooks/useDeleteProject.ts';
import { ProjectData, useGetProject } from '../../spaces/onboarding/hooks/useGetProject.ts';
import { useUpdateProject } from '../../spaces/onboarding/hooks/useUpdateProject.ts';
import { ProjectsListItemMenu } from './ProjectsListItemMenu.tsx';

const fakeUseDeleteProject: typeof useDeleteProject = () => ({
  deleteProject: async (): Promise<void> => {},
});

const fakeUseUpdateProject: typeof useUpdateProject = () => ({
  updateProject: async (): Promise<void> => {},
});

const projectData: ProjectData = {
  name: 'test-project',
  displayName: 'My Test Project',
  chargingTarget: '12345678-1234-1234-1234-123456789abc',
  chargingTargetType: 'btp',
  members: [{ name: 'user@example.com', kind: 'User', roles: [MemberRoles.admin] }],
};

const fakeUseGetProject: typeof useGetProject = () => ({
  projectData,
  isLoading: false,
  error: undefined,
});

const mountMenu = (projectName = 'test-project') =>
  cy.mount(
    <ProjectsListItemMenu
      projectName={projectName}
      useDeleteProject={fakeUseDeleteProject}
      useUpdateProject={fakeUseUpdateProject}
      useGetProject={fakeUseGetProject}
    />,
  );

describe('ProjectsListItemMenu', () => {
  it('deletes the project', () => {
    let deleteProjectCalled = false;
    const deletingUseDeleteProject: typeof useDeleteProject = () => ({
      deleteProject: async (): Promise<void> => {
        deleteProjectCalled = true;
      },
    });

    cy.mount(
      <ProjectsListItemMenu
        projectName="test-project"
        useDeleteProject={deletingUseDeleteProject}
        useUpdateProject={fakeUseUpdateProject}
        useGetProject={fakeUseGetProject}
      />,
    );

    cy.get('ui5-button[icon="overflow"]').click();
    cy.contains('Delete project').click({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('test-project');
    cy.then(() => cy.wrap(deleteProjectCalled).should('equal', false));
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
    cy.then(() => cy.wrap(deleteProjectCalled).should('equal', true));
  });

  it('opens edit dialog and pre-populates project name', () => {
    mountMenu();

    cy.get('ui5-button[icon="overflow"]').click();
    cy.contains('Edit project').click({ force: true });

    cy.get('ui5-dialog[open]').should('exist');
    cy.get('#name').should('have.attr', 'disabled');
    cy.get('#name').invoke('prop', 'value').should('eq', 'test-project');
  });

  it('edits display name and saves', () => {
    let updatePayload: Parameters<ReturnType<typeof useUpdateProject>['updateProject']>[0] | null = null;
    const capturingUseUpdateProject: typeof useUpdateProject = () => ({
      updateProject: async (params) => {
        updatePayload = params;
      },
    });

    cy.mount(
      <ProjectsListItemMenu
        projectName="test-project"
        useDeleteProject={fakeUseDeleteProject}
        useUpdateProject={capturingUseUpdateProject}
        useGetProject={fakeUseGetProject}
      />,
    );

    cy.get('ui5-button[icon="overflow"]').click();
    cy.contains('Edit project').click({ force: true });

    // Wait for the dialog form to be fully rendered (not in loading state)
    cy.get('#displayName').should('not.have.attr', 'disabled');
    cy.get('#displayName').clearUi5Input();
    cy.get('#displayName').typeIntoUi5Input('Updated Display Name');
    cy.get('ui5-button').contains('Save').click();

    cy.then(() => {
      cy.wrap(updatePayload).should('not.be.null');
      cy.wrap(updatePayload).should('deep.equal', {
        name: 'test-project',
        displayName: 'Updated Display Name',
        chargingTarget: '12345678-1234-1234-1234-123456789abc',
        chargingTargetType: 'btp',
        members: [{ name: 'user@example.com', kind: 'User', roles: ['admin'] }],
      });
    });
  });

  it('adds a member and saves', () => {
    let updatePayload: Parameters<ReturnType<typeof useUpdateProject>['updateProject']>[0] | null = null;
    const capturingUseUpdateProject: typeof useUpdateProject = () => ({
      updateProject: async (params) => {
        updatePayload = params;
      },
    });

    cy.mount(
      <ProjectsListItemMenu
        projectName="test-project"
        useDeleteProject={fakeUseDeleteProject}
        useUpdateProject={capturingUseUpdateProject}
        useGetProject={fakeUseGetProject}
      />,
    );

    cy.get('ui5-button[icon="overflow"]').click();
    cy.contains('Edit project').click({ force: true });

    cy.get('[data-testid="add-member-button"]').first().click({ force: true });
    cy.get('[data-testid="member-email-input"]').typeIntoUi5Input('new-user@example.com');
    cy.get('[data-testid="add-member-button"]').last().click({ force: true });

    cy.get('ui5-button').contains('Save').click();

    cy.then(() => {
      cy.wrap(updatePayload).should('not.be.null');
      cy.wrap(updatePayload)
        .its('members')
        .should('have.length', 2)
        .and('deep.include', { name: 'user@example.com', kind: 'User', roles: ['admin'] });
    });
  });
});
