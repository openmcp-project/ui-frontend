import { MockedProvider } from '@apollo/client/testing/react';
import '@ui5/webcomponents-cypress-commands';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { MemoryRouter } from 'react-router-dom';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { useAuthOnboarding } from '../../../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';

TimeAgo.addDefaultLocale(en);

const workspace: Workspace = {
  metadata: {
    name: 'workspaceName',
    namespace: 'project-webapp-playground--ws-workspaceName',
    annotations: {},
  },
  spec: { members: [{ kind: 'User', name: 'test@example.com', roles: ['admin'] }] },
  status: { namespace: 'project-webapp-playground--ws-workspaceName' },
};

const fakeManagedControlPlanes: ControlPlaneListItem[] = [
  {
    version: 'v1',
    metadata: {
      name: 'mcp-a',
      namespace: 'project-webapp-playground--ws-workspaceName',
      creationTimestamp: '2024-05-28T10:00:00Z',
      annotations: {},
    },
    status: { status: ReadyStatus.Ready, conditions: [], access: undefined },
  },
  {
    version: 'v1',
    metadata: {
      annotations: { 'openmcp.cloud/created-by': 'user@example.com', 'openmcp.cloud/display-name': '' },
      name: 'test-cp-b',
      namespace: 'project-test--ws-workspaceName',
      creationTimestamp: '2024-05-28T10:00:00Z',
    },
    status: { status: ReadyStatus.Ready, conditions: [], access: undefined },
  },
  {
    version: 'v1',
    metadata: {
      annotations: { 'openmcp.cloud/created-by': 'user@example.com', 'openmcp.cloud/display-name': '' },
      name: 'flux',
      namespace: 'project-test--ws-workspaceName',
      creationTimestamp: '2024-05-28T10:00:00Z',
    },
    status: { status: ReadyStatus.Ready, conditions: [], access: undefined },
  },
];

const fakeUseAuthOnboarding: typeof useAuthOnboarding = () => ({
  user: { sub: 'u0', email: 'test@example.com' },
  isPending: false,
  isAuthenticated: true,
  error: null,
  login: cy.stub() as never,
  logout: cy.stub() as never,
});

const fakeUseMCPsListQuery: typeof useMcpsQuery = () => ({
  data: fakeManagedControlPlanes,
  error: undefined,
  isPending: false,
  isReadyForSubscriptions: true,
});

const fakeUseDeleteWorkspace: typeof useDeleteWorkspace = () => ({
  deleteWorkspace: async (): Promise<void> => {},
});

const frontendConfig = {
  documentationBaseUrl: '',
  githubBaseUrl: '',
  githubApps: [],
  featureToggles: {
    markMcpV1asDeprecated: false,
    enableMcpV2: false,
    enableHeadlamp: false,
    enableGitHub: false,
    showLandscaperCard: false,
  },
};

function mountTile({
  isExpanded = false,
  onToggle = cy.stub(),
  deleteWorkspace = fakeUseDeleteWorkspace,
}: {
  isExpanded?: boolean;
  onToggle?: () => void;
  deleteWorkspace?: typeof fakeUseDeleteWorkspace;
} = {}) {
  cy.mount(
    <MockedProvider mocks={[]}>
      <MemoryRouter>
        <FrontendConfigContext.Provider value={frontendConfig}>
          <SplitterProvider>
            <FeatureToggleProvider>
              <ControlPlaneListWorkspaceGridTile
                workspace={workspace}
                projectName="some-project"
                isExpanded={isExpanded}
                useMcpsQuery={fakeUseMCPsListQuery}
                useDeleteWorkspace={deleteWorkspace}
                useAuthOnboardingHook={fakeUseAuthOnboarding}
                onToggleExpanded={onToggle}
              />
            </FeatureToggleProvider>
          </SplitterProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>
    </MockedProvider>,
  );
}

describe('ControlPlaneListWorkspaceGridTile', () => {
  it('deletes the workspace', () => {
    let deleteWorkspaceCalled = false;
    mountTile({
      isExpanded: true,
      deleteWorkspace: () => ({
        deleteWorkspace: async () => {
          deleteWorkspaceCalled = true;
        },
      }),
    });

    cy.get("[data-testid='ControlPlanesListMenu-opener']").click();
    cy.contains('Delete workspace').click({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('workspaceName');
    cy.then(() => cy.wrap(deleteWorkspaceCalled).should('equal', false));
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
    cy.then(() => cy.wrap(deleteWorkspaceCalled).should('equal', true));
  });

  describe('lazy loading — ControlPlaneCards only mount when workspace is expanded', () => {
    it('does NOT render ControlPlaneCards when workspace is collapsed', () => {
      let kpiRequestCount = 0;
      cy.intercept('GET', '**/managedcontrolplanes/**').as('mcpComponentsRest');
      cy.intercept('POST', '**/graphql', (req) => {
        const body = req.body as { operationName?: string };
        if (
          ['GetCrossplane', 'GetFlux', 'GetLandscaper', 'GetExternalSecretsOperator'].includes(body.operationName ?? '')
        ) {
          kpiRequestCount++;
        }
        req.continue();
      });

      mountTile({ isExpanded: false });

      cy.get('[data-testid="workspace-panel-workspaceName"]').should('exist');
      cy.get('[data-testid="workspace-panel-workspaceName"]')
        .find('button')
        .first()
        .invoke('attr', 'aria-expanded')
        .should('eq', 'false');

      cy.contains('mcp-a').should('not.exist');
      cy.contains('test-cp-b').should('not.exist');

      cy.get('@mcpComponentsRest.all').should('have.length', 0);
      cy.then(() => expect(kpiRequestCount).to.equal(0));
    });

    it('renders ControlPlaneCards when workspace is expanded', () => {
      cy.intercept('GET', '**/managedcontrolplanes/**').as('mcpComponentsRest');

      mountTile({ isExpanded: true });

      cy.get('[data-testid="workspace-panel-workspaceName"]')
        .find('button')
        .first()
        .invoke('attr', 'aria-expanded')
        .should('eq', 'true');

      cy.contains('mcp-a').should('exist');

      cy.get('@mcpComponentsRest.all').should('have.length.greaterThan', 0);
    });

    it('calls onToggleExpanded when the header button is clicked', () => {
      const onToggle = cy.stub().as('onToggle');
      mountTile({ isExpanded: false, onToggle });

      cy.get('[data-testid="workspace-panel-workspaceName"]').find('button').first().click();
      cy.get('@onToggle').should('have.been.calledOnce');
    });
  });
});

describe('ControlPlaneListWorkspaceGridTile — access control', () => {
  const memberUser: typeof useAuthOnboarding = () => ({
    user: { sub: 'u1', email: 'member@example.com' },
    isPending: false,
    isAuthenticated: true,
    error: null,
    login: cy.stub() as never,
    logout: cy.stub() as never,
  });

  const nonMemberUser: typeof useAuthOnboarding = () => ({
    user: { sub: 'u2', email: 'outsider@example.com' },
    isPending: false,
    isAuthenticated: true,
    error: null,
    login: cy.stub() as never,
    logout: cy.stub() as never,
  });

  const workspaceWithMember: Workspace = {
    metadata: { name: 'workspaceName', namespace: 'project-webapp-playground--ws-workspaceName', annotations: {} },
    spec: { members: [{ kind: 'User', name: 'member@example.com', roles: ['admin'] }] },
    status: { namespace: 'project-webapp-playground--ws-workspaceName' },
  };

  function mountAccessTile(opts: {
    useAuthOnboardingHook: typeof useAuthOnboarding;
    ws?: Workspace;
    useMcpsQuery?: typeof useMcpsQuery;
  }) {
    const ws = opts.ws ?? workspaceWithMember;
    cy.mount(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <FrontendConfigContext.Provider value={frontendConfig}>
            <SplitterProvider>
              <FeatureToggleProvider>
                <ControlPlaneListWorkspaceGridTile
                  workspace={ws}
                  projectName="some-project"
                  isExpanded={false}
                  useMcpsQuery={opts.useMcpsQuery ?? fakeUseMCPsListQuery}
                  useDeleteWorkspace={fakeUseDeleteWorkspace}
                  useAuthOnboardingHook={opts.useAuthOnboardingHook}
                  onToggleExpanded={cy.stub()}
                />
              </FeatureToggleProvider>
            </SplitterProvider>
          </FrontendConfigContext.Provider>
        </MemoryRouter>
      </MockedProvider>,
    );
  }

  it('shows expand toggle when user is a member', () => {
    mountAccessTile({ useAuthOnboardingHook: memberUser });

    cy.get('[data-testid="workspace-panel-workspaceName"]').find('button').first().should('have.attr', 'aria-expanded');
    cy.get('[id^="forbidden-btn"]').should('not.exist');
  });

  it('shows locked icon and no expand toggle when user is not a member', () => {
    mountAccessTile({ useAuthOnboardingHook: nonMemberUser });

    cy.get('[id^="forbidden-btn"]').should('exist');
    cy.get('[data-testid="workspace-panel-workspaceName"]')
      .find('button[aria-expanded]')
      .not('[id^="forbidden-btn"]')
      .should('not.exist');
  });

  it('opens a popover with the permission error message when locked icon is clicked', () => {
    mountAccessTile({ useAuthOnboardingHook: nonMemberUser });

    cy.get('[id^="forbidden-btn"]').click();
    cy.get('ui5-popover[open]').should('exist');
  });

  it('does not fire GetMCPsList for non-members even when expanded', () => {
    const querySpy = cy.stub().as('querySpy').returns({
      data: [],
      error: undefined,
      isPending: false,
      isReadyForSubscriptions: false,
    });

    mountAccessTile({ useAuthOnboardingHook: nonMemberUser, useMcpsQuery: querySpy });

    cy.get('@querySpy').should('always.have.been.calledWithMatch', 'project-some-project--ws-workspaceName', {
      mode: 'skip',
    });
  });

  it('hides member avatars when workspace is collapsed', () => {
    cy.mount(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <FrontendConfigContext.Provider value={frontendConfig}>
            <SplitterProvider>
              <FeatureToggleProvider>
                <ControlPlaneListWorkspaceGridTile
                  workspace={workspaceWithMember}
                  projectName="some-project"
                  isExpanded={false}
                  useMcpsQuery={fakeUseMCPsListQuery}
                  useDeleteWorkspace={fakeUseDeleteWorkspace}
                  useAuthOnboardingHook={memberUser}
                  onToggleExpanded={cy.stub()}
                />
              </FeatureToggleProvider>
            </SplitterProvider>
          </FrontendConfigContext.Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-avatar-group').should('not.exist');
  });

  it('shows member avatars when workspace is expanded', () => {
    cy.mount(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <FrontendConfigContext.Provider value={frontendConfig}>
            <SplitterProvider>
              <FeatureToggleProvider>
                <ControlPlaneListWorkspaceGridTile
                  workspace={workspaceWithMember}
                  projectName="some-project"
                  isExpanded={true}
                  useMcpsQuery={fakeUseMCPsListQuery}
                  useDeleteWorkspace={fakeUseDeleteWorkspace}
                  useAuthOnboardingHook={memberUser}
                  onToggleExpanded={cy.stub()}
                />
              </FeatureToggleProvider>
            </SplitterProvider>
          </FrontendConfigContext.Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get('ui5-avatar-group').should('exist');
  });
});
