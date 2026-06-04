import { MockedProvider } from '@apollo/client/testing/react';
import '@ui5/webcomponents-cypress-commands';
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

  const mountTile = (workspace: Workspace, query: typeof useMcpsQuery) => {
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
                  useMcpsQuery={query}
                  useDeleteWorkspace={fakeUseDeleteWorkspace}
                />
              </FeatureToggleProvider>
            </SplitterProvider>
          </FrontendConfigContext.Provider>
        </MemoryRouter>
      </MockedProvider>,
    );
  };

  it('shows health indicator with 3 pills when all control planes are ready', () => {
    const workspace: Workspace = {
      metadata: { name: 'workspaceName', namespace: 'project-webapp-playground--ws-workspaceName', annotations: {} },
      spec: { members: [] },
    };
    mountTile(workspace, fakeUseMCPsListQuery);
    cy.get('[data-testid="health-pill"]').should('have.length', 3);
  });

  it('shows health indicator with correct pill count for mixed health', () => {
    const mixedControlPlanes: ControlPlaneListItem[] = [
      {
        version: 'v1',
        metadata: {
          name: 'mcp-ready',
          namespace: 'project-test--ws-test',
          creationTimestamp: '2024-05-28T10:00:00Z',
          annotations: {},
        },
        status: { status: ReadyStatus.Ready, conditions: [], access: undefined },
      },
      {
        version: 'v1',
        metadata: {
          name: 'mcp-notready-1',
          namespace: 'project-test--ws-test',
          creationTimestamp: '2024-05-28T10:00:00Z',
          annotations: {},
        },
        status: { status: ReadyStatus.NotReady, conditions: [], access: undefined },
      },
      {
        version: 'v1',
        metadata: {
          name: 'mcp-notready-2',
          namespace: 'project-test--ws-test',
          creationTimestamp: '2024-05-28T10:00:00Z',
          annotations: {},
        },
        status: { status: ReadyStatus.NotReady, conditions: [], access: undefined },
      },
    ];

    const fakeQueryMixed: typeof useMcpsQuery = () => ({
      data: mixedControlPlanes,
      error: undefined,
      isPending: false,
    });

    const workspace: Workspace = {
      metadata: { name: 'test', namespace: 'project-test--ws-test', annotations: {} },
      spec: { members: [] },
    };
    mountTile(workspace, fakeQueryMixed);
    cy.get('[data-testid="health-pill"]').should('have.length', 3);
  });

  it('does not show health indicator when workspace has no control planes', () => {
    const emptyQuery: typeof useMcpsQuery = () => ({ data: [], error: undefined, isPending: false });
    const workspace: Workspace = {
      metadata: { name: 'empty-ws', namespace: 'project-test--ws-empty', annotations: {} },
      spec: { members: [] },
    };
    mountTile(workspace, emptyQuery);
    cy.get('[class*="healthBar"]').should('not.exist');
  });

  it('does not show health indicator while loading', () => {
    const pendingQuery: typeof useMcpsQuery = () => ({ data: [], error: undefined, isPending: true });
    const workspace: Workspace = {
      metadata: { name: 'loading-ws', namespace: 'project-test--ws-loading', annotations: {} },
      spec: { members: [] },
    };
    mountTile(workspace, pendingQuery);
    cy.get('[class*="healthBar"]').should('not.exist');
  });
});
