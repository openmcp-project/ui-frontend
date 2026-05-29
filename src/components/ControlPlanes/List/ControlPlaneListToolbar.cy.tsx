import { ControlPlaneListToolbar } from './ControlPlaneListToolbar.tsx';
import { useDeleteProject } from '../../../spaces/onboarding/hooks/useDeleteProject.ts';
import { useNavigate, MemoryRouter } from 'react-router-dom';
import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import { CopyButtonProvider } from '../../../context/CopyButtonContext.tsx';
import { AuthProviderOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';

describe('ControlPlaneListToolbar', () => {
  let deleteProjectCalled = false;
  let navigateCalled = false;
  let navigateTarget = '';

  const fakeUseDeleteProject: typeof useDeleteProject = () => ({
    deleteProject: async (): Promise<void> => {
      deleteProjectCalled = true;
    },
  });

  const fakeUseNavigate: typeof useNavigate = () => {
    return ((path: unknown) => {
      navigateCalled = true;
      navigateTarget = String(path);
    }) as ReturnType<typeof useNavigate>;
  };

  beforeEach(() => {
    deleteProjectCalled = false;
    navigateCalled = false;
    navigateTarget = '';
  });

  it('shows delete option in overflow menu', () => {
    const projectName = 'test-project';

    cy.mount(
      <MockedProvider mocks={[]}>
        <AuthProviderOnboarding>
          <MemoryRouter>
            <CopyButtonProvider>
              <ControlPlaneListToolbar
                projectName={projectName}
                useDeleteProject={fakeUseDeleteProject}
                useNavigate={fakeUseNavigate}
              />
            </CopyButtonProvider>
          </MemoryRouter>
        </AuthProviderOnboarding>
      </MockedProvider>,
    );

    // Open overflow menu
    cy.get('[data-testid="project-overflow-menu"]').click();

    // Verify delete option is visible
    cy.contains('Delete project').should('be.visible');
  });

  it('deletes the project and navigates to projects list when confirmed', () => {
    const projectName = 'test-project';

    cy.mount(
      <MockedProvider mocks={[]}>
        <AuthProviderOnboarding>
          <MemoryRouter>
            <CopyButtonProvider>
              <ControlPlaneListToolbar
                projectName={projectName}
                useDeleteProject={fakeUseDeleteProject}
                useNavigate={fakeUseNavigate}
              />
            </CopyButtonProvider>
          </MemoryRouter>
        </AuthProviderOnboarding>
      </MockedProvider>,
    );

    // Open overflow menu
    cy.get('[data-testid="project-overflow-menu"]').click();

    // Click delete option
    cy.contains('Delete project').click({ force: true });

    // Type confirmation text
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input(projectName);

    // Verify delete not called yet
    cy.then(() => cy.wrap(deleteProjectCalled).should('equal', false));
    cy.then(() => cy.wrap(navigateCalled).should('equal', false));

    // Click delete button
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();

    // Verify delete was called and navigation happened
    cy.then(() => cy.wrap(deleteProjectCalled).should('equal', true));
    cy.then(() => cy.wrap(navigateCalled).should('equal', true));
    cy.then(() => cy.wrap(navigateTarget).should('equal', '/mcp/projects'));
  });

  it('cancels delete when dialog is closed', () => {
    const projectName = 'test-project';

    cy.mount(
      <MockedProvider mocks={[]}>
        <AuthProviderOnboarding>
          <MemoryRouter>
            <CopyButtonProvider>
              <ControlPlaneListToolbar
                projectName={projectName}
                useDeleteProject={fakeUseDeleteProject}
                useNavigate={fakeUseNavigate}
              />
            </CopyButtonProvider>
          </MemoryRouter>
        </AuthProviderOnboarding>
      </MockedProvider>,
    );

    // Open overflow menu
    cy.get('[data-testid="project-overflow-menu"]').click();

    // Click delete option
    cy.contains('Delete project').click({ force: true });

    // Close dialog without confirming
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Cancel').click();

    // Verify delete and navigate were not called
    cy.then(() => cy.wrap(deleteProjectCalled).should('equal', false));
    cy.then(() => cy.wrap(navigateCalled).should('equal', false));
  });
});
