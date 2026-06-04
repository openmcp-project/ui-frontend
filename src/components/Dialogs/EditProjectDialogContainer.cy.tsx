import { EditProjectDialogContainer } from './EditProjectDialogContainer';
import { useUpdateProject } from '../../spaces/onboarding/hooks/useUpdateProject';
import { useGetProject, ProjectData } from '../../spaces/onboarding/hooks/useGetProject';
import { MemberRoles } from '../../lib/api/types/shared/members';

const projectData: ProjectData = {
  name: 'existing-project',
  displayName: 'Existing Display Name',
  chargingTarget: '12345678-1234-1234-1234-123456789abc',
  chargingTargetType: 'btp',
  members: [{ name: 'admin@example.com', kind: 'User', roles: [MemberRoles.admin] }],
};

const fakeUseGetProject: typeof useGetProject = () => ({
  projectData,
  isLoading: false,
  error: undefined,
});

const fakeUseUpdateProject: typeof useUpdateProject = () => ({
  updateProject: async () => {},
});

describe('EditProjectDialogContainer', () => {
  it('pre-populates form with existing project data', () => {
    cy.mount(
      <EditProjectDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        projectName="existing-project"
        useGetProject={fakeUseGetProject}
        useUpdateProject={fakeUseUpdateProject}
      />,
    );

    cy.get('#name').invoke('prop', 'value').should('eq', 'existing-project');
    cy.get('#name').should('have.attr', 'disabled');
    cy.get('#displayName').find('input[id*="inner"]').should('have.value', 'Existing Display Name');
    cy.get('#chargingTarget').find('input[id*="inner"]').should('have.value', '12345678-1234-1234-1234-123456789abc');
    cy.contains('admin@example.com').should('exist');
  });

  it('name field is always disabled — cannot be changed', () => {
    cy.mount(
      <EditProjectDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        projectName="existing-project"
        useGetProject={fakeUseGetProject}
        useUpdateProject={fakeUseUpdateProject}
      />,
    );

    cy.get('#name').should('have.attr', 'disabled');
    cy.get('#name').invoke('prop', 'value').should('eq', 'existing-project');
  });

  it('sends correct full payload on save', () => {
    let updatePayload: Parameters<ReturnType<typeof useUpdateProject>['updateProject']>[0] | null = null;

    cy.mount(
      <EditProjectDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        projectName="existing-project"
        useGetProject={fakeUseGetProject}
        useUpdateProject={() => ({
          updateProject: async (params) => {
            updatePayload = params;
          },
        })}
      />,
    );

    cy.get('#displayName').find('input[id*="inner"]').clear().type('Updated Name');
    cy.get('ui5-button').contains('Save').click();

    cy.then(() => {
      cy.wrap(updatePayload).should('not.be.null');
      cy.wrap(updatePayload).should('deep.equal', {
        name: 'existing-project',
        displayName: 'Updated Name',
        chargingTarget: '12345678-1234-1234-1234-123456789abc',
        chargingTargetType: 'btp',
        members: [{ name: 'admin@example.com', kind: 'User', roles: ['admin'] }],
      });
    });
  });

  it('closes dialog on successful save', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <EditProjectDialogContainer
        isOpen={true}
        setIsOpen={setIsOpen}
        projectName="existing-project"
        useGetProject={fakeUseGetProject}
        useUpdateProject={fakeUseUpdateProject}
      />,
    );

    cy.get('ui5-button').contains('Save').click();
    cy.wrap(setIsOpen).should('have.been.calledWith', false);
  });

  it('does not close dialog when update fails and shows error', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <EditProjectDialogContainer
        isOpen={true}
        setIsOpen={setIsOpen}
        projectName="existing-project"
        useGetProject={fakeUseGetProject}
        useUpdateProject={() => ({
          updateProject: async () => {
            throw new Error('Update failed');
          },
        })}
      />,
    );

    cy.get('ui5-button').contains('Save').click();

    cy.wrap(setIsOpen).should('not.have.been.called');
    cy.contains('Update failed').should('be.visible');
    // Form state is preserved — user can retry
    cy.get('#name').invoke('prop', 'value').should('eq', 'existing-project');
  });

  it('shows busy indicator while loading', () => {
    const loadingUseGetProject: typeof useGetProject = () => ({
      projectData: undefined,
      isLoading: true,
      error: undefined,
    });

    cy.mount(
      <EditProjectDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        projectName="existing-project"
        useGetProject={loadingUseGetProject}
        useUpdateProject={fakeUseUpdateProject}
      />,
    );

    cy.get('ui5-busy-indicator').should('exist');
    cy.get('#name').should('not.exist');
  });

  it('shows error dialog when project fetch fails', () => {
    const errorUseGetProject: typeof useGetProject = () => ({
      projectData: undefined,
      isLoading: false,
      error: new Error('Failed to load project'),
    });

    cy.mount(
      <EditProjectDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        projectName="existing-project"
        useGetProject={errorUseGetProject}
        useUpdateProject={fakeUseUpdateProject}
      />,
    );

    cy.contains('Failed to load project').should('be.visible');
  });
});
