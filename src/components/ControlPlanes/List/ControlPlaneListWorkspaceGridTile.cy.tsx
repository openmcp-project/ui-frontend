import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { useManagedControlPlanesQuery } from '../../../hooks/useManagedControlPlanesQuery.ts';
import { ControlPlaneType, ReadyStatus } from '../../../lib/api/types/crate/controlPlanes.ts';
import { MemoryRouter } from 'react-router-dom';
import { useDeleteWorkspace } from '../../../hooks/useDeleteWorkspace.ts';
import '@ui5/webcomponents-cypress-commands';
import { ListWorkspacesType } from '../../../lib/api/types/crate/listWorkspaces.ts';

describe('ControlPlaneListWorkspaceGridTile', () => {
  let deleteWorkspaceCalled = false;
  const fakeUseDeleteWorkspace: typeof useDeleteWorkspace = () => ({
    deleteWorkspace: async (): Promise<void> => {
      deleteWorkspaceCalled = true;
    },
  });

  const fakeManagedControlPlanes: ControlPlaneType[] = [
    {
      metadata: {
        name: 'mcp-a',
        namespace: 'project-webapp-playground--ws-workspaceName',
        creationTimestamp: '2024-05-28T10:00:00Z',
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        components: {
          crossplane: undefined,
          btpServiceOperator: undefined,
          externalSecretsOperator: undefined,
          kyverno: undefined,
          flux: undefined,
          landscaper: undefined,
        },
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    },
    {
      metadata: {
        annotations: {
          'openmcp.cloud/created-by': 'andreas.kienle@sap.com',
          'openmcp.cloud/display-name': '',
        },
        name: 'd056765-all',
        namespace: 'project-webapp-playground--ws-d056765',
        creationTimestamp: '2024-05-28T10:00:00Z',
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        components: {
          crossplane: undefined,
          btpServiceOperator: undefined,
          externalSecretsOperator: undefined,
          kyverno: undefined,
          flux: undefined,
          landscaper: undefined,
        },
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    },
    {
      metadata: {
        annotations: {
          'openmcp.cloud/created-by': 'andreas.kienle@sap.com',
          'openmcp.cloud/display-name': '',
        },
        name: 'flux',
        namespace: 'project-webapp-playground--ws-d056765',
        creationTimestamp: '2024-05-28T10:00:00Z',
      },
      spec: {
        authentication: {
          enableSystemIdentityProvider: true,
        },
        components: {
          crossplane: undefined,
          btpServiceOperator: undefined,
          externalSecretsOperator: undefined,
          kyverno: undefined,
          flux: undefined,
          landscaper: undefined,
        },
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    },
  ];

  const fakeUseManagedControlPlanesQuery: typeof useManagedControlPlanesQuery = () => ({
    managedControlPlanes: fakeManagedControlPlanes,
    error: undefined,
    isLoading: false,
  });

  beforeEach(() => {
    deleteWorkspaceCalled = false;
  });

  it('deletes the workspace', () => {
    const workspace: ListWorkspacesType = {
      metadata: {
        name: 'workspaceName',
      },
      spec: {
        members: [],
      },
    } as unknown as ListWorkspacesType;

    cy.mount(
      <MemoryRouter>
        <SplitterProvider>
          <ControlPlaneListWorkspaceGridTile
            workspace={workspace}
            projectName="some-project"
            useManagedControlPlanesQuery={fakeUseManagedControlPlanesQuery}
            useDeleteWorkspace={fakeUseDeleteWorkspace}
          />
        </SplitterProvider>
      </MemoryRouter>,
    );

    cy.get("[data-testid='ControlPlanesListMenu-opener']").click();
    cy.contains('Delete workspace').click({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('workspaceName');
    cy.then(() => cy.wrap(deleteWorkspaceCalled).should('equal', false));
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
    cy.then(() => cy.wrap(deleteWorkspaceCalled).should('equal', true));
  });
});
