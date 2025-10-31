import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { ListControlPlanesType } from '../../../lib/api/types/crate/controlPlanes.ts';
import { MemoryRouter } from 'react-router-dom';
import '@ui5/webcomponents-cypress-commands';
import { ControlPlaneCard } from './ControlPlaneCard.tsx';
import { useDeleteManagedControlPlane } from '../../../hooks/useDeleteManagedControlPlane.ts';
import { ListWorkspacesType } from '../../../lib/api/types/crate/listWorkspaces.ts';

describe('ControlPlaneCard', () => {
  let deleteManagedControlPlaneCalled = false;
  const fakeUseDeleteManagedControlPlane: typeof useDeleteManagedControlPlane = () => ({
    deleteManagedControlPlane: async (): Promise<void> => {
      deleteManagedControlPlaneCalled = true;
    },
  });

  beforeEach(() => {
    deleteManagedControlPlaneCalled = false;
  });

  it('deletes the workspace', () => {
    const managedControlPlane: ListControlPlanesType = {
      metadata: {
        name: 'mcp-name',
      },
    } as unknown as ListControlPlanesType;

    const workspace: ListWorkspacesType = {
      metadata: {
        name: 'workspaceName',
      },
    } as unknown as ListWorkspacesType;

    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ControlPlaneCard
            controlPlane={managedControlPlane}
            workspace={workspace}
            projectName="projectName"
            useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.get("[data-testid='ControlPlaneCardMenu-opener']").click();
    cy.contains('Delete ManagedControlPlane').click({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('mcp-name');
    cy.then(() => cy.wrap(deleteManagedControlPlaneCalled).should('equal', false));
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
    cy.then(() => cy.wrap(deleteManagedControlPlaneCalled).should('equal', true));
  });
});
