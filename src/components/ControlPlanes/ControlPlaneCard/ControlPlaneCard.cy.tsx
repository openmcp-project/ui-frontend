import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { useDeleteManagedControlPlane } from '../../../hooks/useDeleteManagedControlPlane.ts';
import { useDeleteControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useDeleteControlPlaneV2GraphQL.ts';
import { GET_MCP_V2_QUERY } from '../../../spaces/onboarding/hooks/controlPlaneV2/useControlPlaneV2Query.ts';
import { ControlPlaneListItem } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { ControlPlaneCard } from './ControlPlaneCard.tsx';
import type { useMcpComponents } from './useMcpComponents.ts';
import type { useMcpV2Components } from './useMcpV2Components.ts';

TimeAgo.addDefaultLocale(en);

// Renders the current router path so tests can assert navigation.
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
}

const mockFrontendConfig = {
  documentationBaseUrl: 'https://example.com',
  githubBaseUrl: 'https://github.com',
  featureToggles: {
    markMcpV1asDeprecated: false,
  },
};

const workspace: Workspace = {
  metadata: { name: 'workspaceName', namespace: 'test-namespace', annotations: {} },
  spec: { members: [] },
  status: null,
};

const v1ControlPlane: ControlPlaneListItem = {
  version: 'v1',
  metadata: {
    name: 'mcp-name',
    namespace: 'test-namespace',
    creationTimestamp: '2024-01-01T00:00:00Z',
    annotations: {},
  },
  status: null,
};

const v2ControlPlane: ControlPlaneListItem = {
  version: 'v2',
  metadata: {
    name: 'cp-name',
    namespace: 'project-my-project--ws-default',
    creationTimestamp: '2024-06-01T12:00:00Z',
    annotations: {},
  },
  status: null,
};

const fakeUseDeleteManagedControlPlane: typeof useDeleteManagedControlPlane = () => ({
  deleteManagedControlPlane: async (): Promise<void> => {},
});

const fakeUseDeleteManagedControlPlaneV2GraphQL: typeof useDeleteControlPlaneV2GraphQL = () => ({
  deleteManagedControlPlaneV2: async (): Promise<void> => {},
});

const fakeUseMcpComponentsLoading: typeof useMcpComponents = () => ({
  components: null,
  roleBindings: undefined,
  isLoading: true,
});

const fakeUseMcpComponentsEmpty: typeof useMcpComponents = () => ({
  components: {},
  roleBindings: undefined,
  isLoading: false,
});

const fakeUseMcpComponentsWithData: typeof useMcpComponents = () => ({
  components: { crossplane: { version: '1.0.0' }, flux: { version: '2.0.0' } },
  roleBindings: [
    { role: 'admin', subjects: [{ kind: 'User', name: 'alice@example.com' }] },
    { role: 'viewer', subjects: [{ kind: 'User', name: 'bob@example.com' }] },
  ],
  isLoading: false,
});

const fakeUseMcpV2ComponentsLoading: typeof useMcpV2Components = () => ({
  components: null,
  isLoading: true,
});

const fakeUseMcpV2ComponentsEmpty: typeof useMcpV2Components = () => ({
  components: {},
  isLoading: false,
});

const fakeUseMcpV2ComponentsWithData: typeof useMcpV2Components = () => ({
  components: { crossplane: true, flux: true },
  isLoading: false,
});

const mountCard = (controlPlane: ControlPlaneListItem) => {
  cy.mount(
    <MockedProvider mocks={[]}>
      <MemoryRouter>
        <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
          <SplitterProvider>
            <FeatureToggleProvider>
              <ControlPlaneCard
                controlPlane={controlPlane}
                workspace={workspace}
                projectName="my-project"
                useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
              />
            </FeatureToggleProvider>
          </SplitterProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>
    </MockedProvider>,
  );
};

describe('ControlPlaneCard', () => {
  it('renders v1 card with ManagedControlPlane kind label', () => {
    mountCard(v1ControlPlane);
    cy.contains('mcp-name').should('exist');
    cy.contains('ManagedControlPlane').should('exist');
  });

  it('renders v2 card with ControlPlane kind label', () => {
    mountCard(v2ControlPlane);
    cy.contains('cp-name').should('exist');
    cy.contains('ControlPlane').should('exist');
  });

  it('v1 card has the three-dots card menu', () => {
    mountCard(v1ControlPlane);
    cy.get("[data-testid='ControlPlaneCardMenu-opener']").should('exist');
  });

  it('v2 card has the v2 three-dots card menu', () => {
    mountCard(v2ControlPlane);
    cy.get("[data-testid='ControlPlaneCardMenuV2-opener']").should('exist');
  });

  it('deletes a v1 control plane', () => {
    let deleteCalled = false;
    const fakeDelete: typeof useDeleteManagedControlPlane = () => ({
      deleteManagedControlPlane: async (): Promise<void> => {
        deleteCalled = true;
      },
    });

    cy.mount(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
            <SplitterProvider>
              <FeatureToggleProvider>
                <ControlPlaneCard
                  controlPlane={v1ControlPlane}
                  workspace={workspace}
                  projectName="my-project"
                  useDeleteManagedControlPlane={fakeDelete}
                  useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                />
              </FeatureToggleProvider>
            </SplitterProvider>
          </FrontendConfigContext.Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    cy.get("[data-testid='ControlPlaneCardMenu-opener']").click();
    cy.contains('Delete').click({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('mcp-name');
    cy.then(() => cy.wrap(deleteCalled).should('equal', false));
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
    cy.then(() => cy.wrap(deleteCalled).should('equal', true));
  });

  it('shows displayName when present', () => {
    const cpWithDisplayName: ControlPlaneListItem = {
      ...v1ControlPlane,
      metadata: {
        ...v1ControlPlane.metadata,
        annotations: { 'openmcp.cloud/display-name': 'My Display Name' },
      },
    };
    mountCard(cpWithDisplayName);
    cy.contains('My Display Name').should('be.visible');
  });

  it('shows deprecated label for v1 when toggle is on', () => {
    const deprecatedConfig = {
      ...mockFrontendConfig,
      featureToggles: { markMcpV1asDeprecated: true },
    };
    cy.mount(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <FrontendConfigContext.Provider value={deprecatedConfig as never}>
            <SplitterProvider>
              <FeatureToggleProvider>
                <ControlPlaneCard
                  controlPlane={v1ControlPlane}
                  workspace={workspace}
                  projectName="my-project"
                  useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                  useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                />
              </FeatureToggleProvider>
            </SplitterProvider>
          </FrontendConfigContext.Provider>
        </MemoryRouter>
      </MockedProvider>,
    );
    cy.contains('Deprecated').should('be.visible');
  });

  describe('component skeletons while loading', () => {
    it('v1 shows 3 skeletons while loading', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v1ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpComponentsHook={fakeUseMcpComponentsLoading}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('[data-testid="component-skeleton"]').should('have.length', 3);
      cy.get('[data-testid="add-component-button"]').should('not.exist');
    });

    it('v2 shows 3 skeletons while loading', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v2ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpV2ComponentsHook={fakeUseMcpV2ComponentsLoading}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('[data-testid="component-skeleton"]').should('have.length', 3);
      cy.get('[data-testid="add-component-button"]').should('not.exist');
    });
  });

  describe('add-component placeholder when empty', () => {
    it('v1 shows + button when no components are installed', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v1ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpComponentsHook={fakeUseMcpComponentsEmpty}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('[data-testid="component-skeleton"]').should('not.exist');
      cy.get('[data-testid="add-component-button"]').should('exist');
    });

    it('v2 shows + button when no components are installed', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v2ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpV2ComponentsHook={fakeUseMcpV2ComponentsEmpty}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('[data-testid="component-skeleton"]').should('not.exist');
      cy.get('[data-testid="add-component-button"]').should('exist');
    });

    it('v1 + button opens the edit wizard', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v1ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpComponentsHook={fakeUseMcpComponentsEmpty}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('[data-testid="v1-wizard-open"]').should('not.exist');
      cy.get('[data-testid="add-component-button"]').should('exist').click();
      cy.get('[data-testid="v1-wizard-open"]').should('exist');
    });

    it('v2 + button navigates to the MCP page', () => {
      const loadingMock = {
        request: {
          query: GET_MCP_V2_QUERY,
          variables: { name: 'cp-name', namespace: 'project-my-project--ws-default' },
        },
        delay: Infinity,
        result: { data: null },
      };
      cy.mount(
        <MockedProvider mocks={[loadingMock]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v2ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpV2ComponentsHook={fakeUseMcpV2ComponentsEmpty}
                  />
                  <LocationDisplay />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      // V2 edit can't add components yet, so the button goes to the MCP page (like view).
      cy.get('[data-testid="v2-wizard-open"]').should('not.exist');
      cy.get('[data-testid="add-component-button"]').should('exist').click();
      cy.get('[data-testid="location-display"]').should(
        'have.text',
        '/projects/my-project/workspaces/workspaceName/controlplane/cp-name',
      );
      cy.get('[data-testid="v2-wizard-open"]').should('not.exist');
    });
  });

  describe('installed components', () => {
    it('v1 renders an icon per installed component', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v1ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpComponentsHook={fakeUseMcpComponentsWithData}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('[title="Crossplane"]').should('exist');
      cy.get('[title="Flux"]').should('exist');
      cy.get('[data-testid="add-component-button"]').should('not.exist');
    });

    it('v2 renders an icon per installed component', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v2ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpV2ComponentsHook={fakeUseMcpV2ComponentsWithData}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('[title="Crossplane"]').should('exist');
      cy.get('[title="Flux"]').should('exist');
      cy.get('[data-testid="add-component-button"]').should('not.exist');
    });

    it('clicking an installed component icon opens the edit wizard', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v1ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpComponentsHook={fakeUseMcpComponentsWithData}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('[data-testid="v1-wizard-open"]').should('not.exist');
      cy.get('[title="Crossplane"]').click();
      cy.get('[data-testid="v1-wizard-open"]').should('exist');
    });
  });

  describe('members avatars', () => {
    it('renders an avatar for each member from roleBindings', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v1ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpComponentsHook={fakeUseMcpComponentsWithData}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('ui5-avatar-group').should('exist');
      cy.get('ui5-avatar-group').find('ui5-avatar').should('have.length', 2);
    });

    it('renders no avatars when there are no members', () => {
      cy.mount(
        <MockedProvider mocks={[]}>
          <MemoryRouter>
            <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
              <SplitterProvider>
                <FeatureToggleProvider>
                  <ControlPlaneCard
                    controlPlane={v1ControlPlane}
                    workspace={workspace}
                    projectName="my-project"
                    useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                    useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                    useMcpComponentsHook={fakeUseMcpComponentsEmpty}
                  />
                </FeatureToggleProvider>
              </SplitterProvider>
            </FrontendConfigContext.Provider>
          </MemoryRouter>
        </MockedProvider>,
      );
      cy.get('ui5-avatar-group').find('ui5-avatar').should('have.length', 0);
    });
  });

  it('does NOT show deprecated label on v2 even when toggle is on', () => {
    const deprecatedConfig = {
      ...mockFrontendConfig,
      featureToggles: { markMcpV1asDeprecated: true },
    };
    cy.mount(
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <FrontendConfigContext.Provider value={deprecatedConfig as never}>
            <SplitterProvider>
              <FeatureToggleProvider>
                <ControlPlaneCard
                  controlPlane={v2ControlPlane}
                  workspace={workspace}
                  projectName="my-project"
                  useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                  useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
                />
              </FeatureToggleProvider>
            </SplitterProvider>
          </FrontendConfigContext.Provider>
        </MemoryRouter>
      </MockedProvider>,
    );
    cy.contains('Deprecated').should('not.exist');
  });
});
