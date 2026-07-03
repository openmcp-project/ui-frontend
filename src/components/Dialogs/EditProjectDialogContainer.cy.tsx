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
  supportServiceIds: '',
  supportLandscape: '',
  supportSecurityContacts: '',
  supportOpsContacts: '',
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
    cy.get('ui5-button').contains('Save').should('not.exist');
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

    cy.contains('Failed to load project').should('exist');
  });

  describe('support-info round-trip', () => {
    // When the project already has support annotations, opening the edit
    // dialog and clicking Save without touching the support step must send
    // the exact same values back — otherwise the round-trip is destructive.
    it('preserves populated support fields when saving without editing them', () => {
      const populatedProjectData: ProjectData = {
        ...projectData,
        supportLandscape: 'production',
        supportServiceIds: 'ID-1, ID-2',
        supportSecurityContacts: 'mail:sec@example.com',
        supportOpsContacts: 'mail:ops@example.com',
      };
      const populatedUseGetProject: typeof useGetProject = () => ({
        projectData: populatedProjectData,
        isLoading: false,
        error: undefined,
      });

      let updatePayload: Parameters<ReturnType<typeof useUpdateProject>['updateProject']>[0] | null = null;
      cy.mount(
        <EditProjectDialogContainer
          isOpen={true}
          setIsOpen={cy.stub()}
          projectName="existing-project"
          useGetProject={populatedUseGetProject}
          useUpdateProject={() => ({
            updateProject: async (params) => {
              updatePayload = params;
            },
          })}
        />,
      );

      cy.get('ui5-button').contains('Save').click();

      cy.then(() => {
        cy.wrap(updatePayload).should('not.be.null');
        cy.wrap(updatePayload).should('include', {
          supportLandscape: 'production',
          supportServiceIds: 'ID-1, ID-2',
          supportSecurityContacts: 'mail:sec@example.com',
          supportOpsContacts: 'mail:ops@example.com',
        });
      });
    });

    // Editing from a clean project must let the user set every support
    // field. The wizard's third step is only reachable via the button that
    // advances past Metadata + Members, so we navigate there first.
    it('writes newly-entered support fields on save', () => {
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

      // Navigate to Support Info step. Two "Next" buttons appear in
      // sequence — one on the Metadata step and one on the Members step.
      cy.contains('ui5-button', 'Next').click();
      cy.contains('ui5-button', 'Next').click();

      // MultiInput commits its editable value into a Token on Enter,
      // which fires the wrapped `change` event our TagListInput listens to.
      cy.get('[data-testid="support-service-ids"]').find('input').type('ID-42{enter}');
      cy.get('[data-testid="support-security-contacts"]').find('input').type('mail:sec@example.com{enter}');
      cy.get('[data-testid="support-ops-contacts"]').find('input').type('mail:ops@example.com{enter}');

      cy.get('ui5-button').contains('Save').click();

      cy.then(() => {
        cy.wrap(updatePayload).should('not.be.null');
        cy.wrap(updatePayload).should('include', {
          supportServiceIds: 'ID-42',
          supportSecurityContacts: 'mail:sec@example.com',
          supportOpsContacts: 'mail:ops@example.com',
        });
      });
    });

    // A regular edit that touches only a non-support field (display name)
    // must not eat support annotations that were already set.
    it('does not drop support fields when editing an unrelated field', () => {
      const populatedProjectData: ProjectData = {
        ...projectData,
        supportLandscape: 'production',
        supportServiceIds: 'ID-1',
        supportSecurityContacts: 'mail:sec@example.com',
        supportOpsContacts: 'mail:ops@example.com',
      };
      const populatedUseGetProject: typeof useGetProject = () => ({
        projectData: populatedProjectData,
        isLoading: false,
        error: undefined,
      });

      let updatePayload: Parameters<ReturnType<typeof useUpdateProject>['updateProject']>[0] | null = null;
      cy.mount(
        <EditProjectDialogContainer
          isOpen={true}
          setIsOpen={cy.stub()}
          projectName="existing-project"
          useGetProject={populatedUseGetProject}
          useUpdateProject={() => ({
            updateProject: async (params) => {
              updatePayload = params;
            },
          })}
        />,
      );

      cy.get('#displayName').find('input[id*="inner"]').clear().type('Renamed');
      cy.get('ui5-button').contains('Save').click();

      cy.then(() => {
        cy.wrap(updatePayload).should('not.be.null');
        cy.wrap(updatePayload).should('include', {
          displayName: 'Renamed',
          supportLandscape: 'production',
          supportServiceIds: 'ID-1',
          supportSecurityContacts: 'mail:sec@example.com',
          supportOpsContacts: 'mail:ops@example.com',
        });
      });
    });
  });
});
