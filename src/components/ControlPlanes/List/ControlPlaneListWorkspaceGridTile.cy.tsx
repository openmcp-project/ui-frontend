import { MockedProvider } from '@apollo/client/testing/react';
import '@ui5/webcomponents-cypress-commands';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { MemoryRouter } from 'react-router-dom';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { useWorkspaceMembers } from '../../../spaces/onboarding/hooks/useWorkspaceMembers.ts';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { MemberRoles } from '../../../lib/api/types/shared/members.ts';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';

TimeAgo.addDefaultLocale(en);

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
              featureToggles: { markMcpV1asDeprecated: false, enableMcpV2: false, enableHeadlamp: false },
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

  const workspace: Workspace = {
    metadata: { name: 'workspaceName', namespace: 'project-test--ws-workspaceName', annotations: {} },
    spec: { members: [] },
    status: { namespace: 'project-test--ws-workspaceName' },
  };

  const fakeUseMcpsQueryEmpty: typeof useMcpsQuery = () => ({ data: [], error: undefined, isPending: false });

  const fakeUseMembersLoading: typeof useWorkspaceMembers = () => ({ members: [], isLoading: true });

  const fakeUseMembersLoaded: typeof useWorkspaceMembers = () => ({
    members: [
      { name: 'alice@example.com', kind: 'User', roles: [MemberRoles.admin] },
      { name: 'bob@example.com', kind: 'User', roles: [MemberRoles.view] },
    ],
    isLoading: false,
  });

  const mountTile = (isExpanded: boolean, useWorkspaceMembersHook: typeof useWorkspaceMembers) =>
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
                  projectName="test-project"
                  isExpanded={isExpanded}
                  useMcpsQuery={fakeUseMcpsQueryEmpty}
                  useDeleteWorkspace={fakeUseDeleteWorkspace}
                  useWorkspaceMembers={useWorkspaceMembersHook}
                />
              </FeatureToggleProvider>
            </SplitterProvider>
          </FrontendConfigContext.Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

  it('does not show members avatar when panel is collapsed', () => {
    mountTile(false, fakeUseMembersLoaded);

    cy.get('ui5-avatar-group').should('not.exist');
    cy.get('[data-testid="members-loading-indicator"]').should('not.exist');
  });

  it('shows busy indicator while members are loading when expanded', () => {
    mountTile(true, fakeUseMembersLoading);

    cy.get('[data-testid="members-loading-indicator"]').should('exist');
    cy.get('ui5-avatar-group').should('not.exist');
  });

  it('shows avatar group with members when expanded and loaded', () => {
    mountTile(true, fakeUseMembersLoaded);

    cy.get('ui5-avatar-group').should('exist');
    cy.get('ui5-avatar').should('have.length', 2);
    cy.get('[data-testid="members-loading-indicator"]').should('not.exist');
  });
});
