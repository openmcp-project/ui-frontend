import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';

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
      <MockedProvider mocks={[]}>
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
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get("[data-testid='ControlPlanesListMenu-opener']").click();
    cy.contains('Delete workspace').click({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('workspaceName');
    cy.then(() => cy.wrap(deleteWorkspaceCalled).should('equal', false));
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
    cy.then(() => cy.wrap(deleteWorkspaceCalled).should('equal', true));
  });

  it('displays WorkspaceHealthIndicator with correct stats for all healthy', () => {
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
      <MockedProvider mocks={[]}>
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
        </MemoryRouter>
      </MockedProvider>,
    );

    // Check health indicator displays "3/3 healthy" when all are ready
    cy.contains('3/3 healthy').should('be.visible');
  });

  it('displays WorkspaceHealthIndicator with correct stats for unhealthy workspace', () => {
    const mixedHealthControlPlanes: ControlPlaneListItem[] = [
      {
        version: 'v1',
        metadata: {
          name: 'mcp-ready',
          namespace: 'project-test--ws-test',
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
          name: 'mcp-notready-1',
          namespace: 'project-test--ws-test',
          creationTimestamp: '2024-05-28T10:00:00Z',
          annotations: {},
        },
        status: {
          status: ReadyStatus.NotReady,
          conditions: [],
          access: undefined,
        },
      },
      {
        version: 'v1',
        metadata: {
          name: 'mcp-notready-2',
          namespace: 'project-test--ws-test',
          creationTimestamp: '2024-05-28T10:00:00Z',
          annotations: {},
        },
        status: {
          status: ReadyStatus.NotReady,
          conditions: [],
          access: undefined,
        },
      },
    ];

    const fakeUseMCPsListQueryMixed: typeof useMcpsQuery = () => ({
      data: mixedHealthControlPlanes,
      error: undefined,
      isPending: false,
    });

    const workspace: Workspace = {
      metadata: {
        name: 'test',
        namespace: 'project-test--ws-test',
        annotations: {},
      },
      spec: {
        members: [],
      },
    };

    cy.mount(
      <MockedProvider mocks={[]}>
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
                  projectName="test"
                  useMcpsQuery={fakeUseMCPsListQueryMixed}
                  useDeleteWorkspace={fakeUseDeleteWorkspace}
                />
              </FeatureToggleProvider>
            </SplitterProvider>
          </FrontendConfigContext.Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    // Check health indicator shows "1/3 healthy" when only 1 is ready
    cy.contains('1/3 healthy').should('be.visible');
  });
});
