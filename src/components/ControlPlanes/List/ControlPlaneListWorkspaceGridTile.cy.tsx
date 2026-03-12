import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { MemoryRouter } from 'react-router-dom';
import { useDeleteWorkspace } from '../../../hooks/useDeleteWorkspace.ts';
import '@ui5/webcomponents-cypress-commands';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';

describe('ControlPlaneListWorkspaceGridTile', () => {
  let deleteWorkspaceCalled = false;
  const fakeUseDeleteWorkspace: typeof useDeleteWorkspace = () => ({
    deleteWorkspace: async (): Promise<void> => {
      deleteWorkspaceCalled = true;
    },
  });

  const fakeManagedControlPlanes: ControlPlaneListItem[] = [
    {
      version: 'v1',
      metadata: {
        name: 'mcp-a',
        namespace: 'project-webapp-playground--ws-workspaceName',
        creationTimestamp: '2024-05-28T10:00:00Z',
        annotations: {},
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    },
    {
      version: 'v1',
      metadata: {
        annotations: {
          'openmcp.cloud/created-by': 'andreas.kienle@sap.com',
          'openmcp.cloud/display-name': '',
        },
        name: 'd056765-all',
        namespace: 'project-webapp-playground--ws-d056765',
        creationTimestamp: '2024-05-28T10:00:00Z',
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    },
    {
      version: 'v1',
      metadata: {
        annotations: {
          'openmcp.cloud/created-by': 'andreas.kienle@sap.com',
          'openmcp.cloud/display-name': '',
        },
        name: 'flux',
        namespace: 'project-webapp-playground--ws-d056765',
        creationTimestamp: '2024-05-28T10:00:00Z',
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    },
  ];

  const fakeUseMCPsListQuery: typeof useMcpsQuery = () => ({
    data: fakeManagedControlPlanes,
    error: undefined,
    isPending: false,
  });

  beforeEach(() => {
    deleteWorkspaceCalled = false;
  });

  it('deletes the workspace', () => {
    const workspace: Workspace = {
      metadata: {
        name: 'workspaceName',
        namespace: 'project-webapp-playground--ws-workspaceName',
        annotations: {},
      },
      spec: {
        members: [],
      },
    };

    cy.mount(
      <MemoryRouter>
        <FrontendConfigContext.Provider
          value={{
            documentationBaseUrl: '',
            githubBaseUrl: '',
            featureToggles: { markMcpV1asDeprecated: false, enableMcpV2: false },
          }}
        >
          <SplitterProvider>
            <FeatureToggleProvider>
              <ControlPlaneListWorkspaceGridTile
                workspace={workspace}
                projectName="some-project"
                useMcpsQuery={fakeUseMCPsListQuery}
                useDeleteWorkspace={fakeUseDeleteWorkspace}
              />
            </FeatureToggleProvider>
          </SplitterProvider>
        </FrontendConfigContext.Provider>
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
