import { EditWorkspaceDialogContainer } from './EditWorkspaceDialogContainer';
import { useUpdateWorkspace } from '../../spaces/onboarding/hooks/useUpdateWorkspace';
import { useGetWorkspace, WorkspaceData } from '../../spaces/onboarding/hooks/useGetWorkspace';
import { MemberRoles } from '../../lib/api/types/shared/members';

const workspaceData: WorkspaceData = {
  name: 'existing-workspace',
  namespace: 'project-test-project',
  displayName: 'Existing Display Name',
  chargingTarget: '12345678-1234-1234-1234-123456789abc',
  chargingTargetType: 'btp',
  members: [{ name: 'admin@example.com', kind: 'User', roles: [MemberRoles.admin] }],
};

const fakeUseGetWorkspace: typeof useGetWorkspace = () => ({
  workspaceData,
  isLoading: false,
  error: undefined,
});

const fakeUseUpdateWorkspace: typeof useUpdateWorkspace = () => ({
  updateWorkspace: async () => {},
});

describe('EditWorkspaceDialogContainer', () => {
  it('pre-populates form with existing workspace data', () => {
    cy.mount(
      <EditWorkspaceDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        workspaceName="existing-workspace"
        namespace="project-test-project"
        useGetWorkspace={fakeUseGetWorkspace}
        useUpdateWorkspace={fakeUseUpdateWorkspace}
      />,
    );

    cy.get('#name').invoke('prop', 'value').should('eq', 'existing-workspace');
    cy.get('#name').should('have.attr', 'disabled');
    cy.get('#displayName').find('input[id*="inner"]').should('have.value', 'Existing Display Name');
    cy.get('#chargingTarget').find('input[id*="inner"]').should('have.value', '12345678-1234-1234-1234-123456789abc');
    cy.contains('admin@example.com').should('exist');
  });

  it('name field is always disabled — cannot be changed', () => {
    cy.mount(
      <EditWorkspaceDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        workspaceName="existing-workspace"
        namespace="project-test-project"
        useGetWorkspace={fakeUseGetWorkspace}
        useUpdateWorkspace={fakeUseUpdateWorkspace}
      />,
    );

    cy.get('#name').should('have.attr', 'disabled');
    cy.get('#name').invoke('prop', 'value').should('eq', 'existing-workspace');
  });

  it('sends correct payload on save', () => {
    let updatePayload: Parameters<ReturnType<typeof useUpdateWorkspace>['updateWorkspace']> | null = null;

    cy.mount(
      <EditWorkspaceDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        workspaceName="existing-workspace"
        namespace="project-test-project"
        useGetWorkspace={fakeUseGetWorkspace}
        useUpdateWorkspace={() => ({
          updateWorkspace: async (ns, params) => {
            updatePayload = [ns, params];
          },
        })}
      />,
    );

    cy.get('#displayName').find('input[id*="inner"]').clear().type('Updated Name');
    cy.get('ui5-button').contains('Save').click();

    cy.then(() => {
      cy.wrap(updatePayload).should('not.be.null');
      cy.wrap(updatePayload).should('deep.equal', [
        'project-test-project',
        {
          name: 'existing-workspace',
          displayName: 'Updated Name',
          chargingTarget: '12345678-1234-1234-1234-123456789abc',
          chargingTargetType: 'btp',
          members: [{ name: 'admin@example.com', kind: 'User', roles: ['admin'] }],
        },
      ]);
    });
  });

  it('closes dialog on successful save', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <EditWorkspaceDialogContainer
        isOpen={true}
        setIsOpen={setIsOpen}
        workspaceName="existing-workspace"
        namespace="project-test-project"
        useGetWorkspace={fakeUseGetWorkspace}
        useUpdateWorkspace={fakeUseUpdateWorkspace}
      />,
    );

    cy.get('ui5-button').contains('Save').click();
    cy.wrap(setIsOpen).should('have.been.calledWith', false);
  });

  it('does not close dialog when update fails and shows error', () => {
    const setIsOpen = cy.stub();

    cy.mount(
      <EditWorkspaceDialogContainer
        isOpen={true}
        setIsOpen={setIsOpen}
        workspaceName="existing-workspace"
        namespace="project-test-project"
        useGetWorkspace={fakeUseGetWorkspace}
        useUpdateWorkspace={() => ({
          updateWorkspace: async () => {
            throw new Error('Update failed');
          },
        })}
      />,
    );

    cy.get('ui5-button').contains('Save').click();
    cy.wrap(setIsOpen).should('not.have.been.called');
    cy.contains('Update failed').should('be.visible');
  });

  it('shows busy indicator while loading', () => {
    const loadingUseGetWorkspace: typeof useGetWorkspace = () => ({
      workspaceData: undefined,
      isLoading: true,
      error: undefined,
    });

    cy.mount(
      <EditWorkspaceDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        workspaceName="existing-workspace"
        namespace="project-test-project"
        useGetWorkspace={loadingUseGetWorkspace}
        useUpdateWorkspace={fakeUseUpdateWorkspace}
      />,
    );

    cy.get('ui5-busy-indicator').should('exist');
    cy.get('ui5-button').contains('Save').should('not.exist');
  });

  it('shows error when workspace fetch fails', () => {
    const errorUseGetWorkspace: typeof useGetWorkspace = () => ({
      workspaceData: undefined,
      isLoading: false,
      error: new Error('Failed to load workspace'),
    });

    cy.mount(
      <EditWorkspaceDialogContainer
        isOpen={true}
        setIsOpen={cy.stub()}
        workspaceName="existing-workspace"
        namespace="project-test-project"
        useGetWorkspace={errorUseGetWorkspace}
        useUpdateWorkspace={fakeUseUpdateWorkspace}
      />,
    );

    cy.contains('Failed to load workspace').should('exist');
  });
});
