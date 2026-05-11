import '@ui5/webcomponents-cypress-commands';
import { MemoryRouter } from 'react-router-dom';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { useDeleteManagedControlPlane } from '../../../hooks/useDeleteManagedControlPlane.ts';
import { useDeleteManagedControlPlaneV2GraphQL } from '../../../spaces/mcp/hooks/useDeleteManagedControlPlaneV2GraphQL.ts';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { ControlPlaneCard } from './ControlPlaneCard.tsx';
import { ControlPlaneCardV2 } from './ControlPlaneCardV2.tsx';

const mockFrontendConfig = {
  documentationBaseUrl: 'https://example.com',
  githubBaseUrl: 'https://github.com',
  featureToggles: {
    markMcpV1asDeprecated: false,
  },
};

describe('ControlPlaneCard', () => {
  let deleteManagedControlPlaneCalled = false;
  const fakeUseDeleteManagedControlPlane: typeof useDeleteManagedControlPlane = () => ({
    deleteManagedControlPlane: async (): Promise<void> => {
      deleteManagedControlPlaneCalled = true;
    },
  });

  const fakeUseDeleteManagedControlPlaneV2GraphQL: typeof useDeleteManagedControlPlaneV2GraphQL = () => ({
    deleteManagedControlPlaneV2: async (): Promise<void> => {},
  });

  beforeEach(() => {
    deleteManagedControlPlaneCalled = false;
  });

  it('deletes the workspace', () => {
    const managedControlPlane: ControlPlaneListItem = {
      version: 'v1',
      metadata: {
        name: 'mcp-name',
        namespace: 'test-namespace',
        creationTimestamp: '2024-01-01T00:00:00Z',
        annotations: {},
      },
      status: null,
    };

    const workspace: Workspace = {
      metadata: {
        name: 'workspaceName',
        namespace: 'test-namespace',
        annotations: {},
      },
      spec: { members: [] },
      status: null,
    };

    cy.mount(
      <MemoryRouter>
        <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
          <SplitterProvider>
            <FeatureToggleProvider>
              <ControlPlaneCard
                controlPlane={managedControlPlane}
                workspace={workspace}
                projectName="projectName"
                useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
              />
            </FeatureToggleProvider>
          </SplitterProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>,
    );

    cy.get("[data-testid='ControlPlaneCardMenu-opener']").click();
    cy.contains('Delete Control Plane').click({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('mcp-name');
    cy.then(() => cy.wrap(deleteManagedControlPlaneCalled).should('equal', false));
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
    cy.then(() => cy.wrap(deleteManagedControlPlaneCalled).should('equal', true));
  });
});

describe('ControlPlaneCardV2', () => {
  const fakeUseDeleteManagedControlPlane: typeof useDeleteManagedControlPlane = () => ({
    deleteManagedControlPlane: async (): Promise<void> => {},
  });

  const fakeUseDeleteManagedControlPlaneV2GraphQL: typeof useDeleteManagedControlPlaneV2GraphQL = () => ({
    deleteManagedControlPlaneV2: async (): Promise<void> => {},
  });

  it('renders skeleton loaders while loading', () => {
    const managedControlPlane: ControlPlaneListItem = {
      version: 'v2',
      metadata: {
        name: 'mcp-name',
        namespace: 'test-namespace',
        creationTimestamp: '2024-01-01T00:00:00Z',
        annotations: {},
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    };

    const workspace: Workspace = {
      metadata: {
        name: 'workspaceName',
        namespace: 'test-namespace',
        annotations: {},
      },
      spec: { members: [] },
      status: null,
    };

    cy.intercept('GET', '**/api/projects/*/workspaces/*/managedcontrolplanes/*', {
      delay: 1000,
      statusCode: 200,
      body: {},
    }).as('getMcp');

    cy.mount(
      <MemoryRouter>
        <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
          <SplitterProvider>
            <FeatureToggleProvider>
              <ControlPlaneCardV2
                controlPlane={managedControlPlane}
                workspace={workspace}
                projectName="projectName"
                useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
              />
            </FeatureToggleProvider>
          </SplitterProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>,
    );

    // Check skeleton loaders are present while loading
    cy.get('[class*="skeletonLabel"]').should('exist');
    cy.get('[class*="skeletonAvatar"]').should('have.length', 3);
    cy.get('[class*="skeletonIcon"]').should('have.length', 3);
  });

  it('displays component icons when loaded', () => {
    const managedControlPlane: ControlPlaneListItem = {
      version: 'v2',
      metadata: {
        name: 'mcp-name',
        namespace: 'test-namespace',
        creationTimestamp: '2024-01-01T00:00:00Z',
        annotations: {},
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    };

    const workspace: Workspace = {
      metadata: {
        name: 'workspaceName',
        namespace: 'test-namespace',
        annotations: {},
      },
      spec: { members: [] },
      status: null,
    };

    cy.intercept('GET', '**/api/projects/*/workspaces/*/managedcontrolplanes/*', {
      statusCode: 200,
      body: {
        spec: {
          components: {
            crossplane: { version: '1.14.0' },
            flux: { version: '2.1.0' },
          },
        },
      },
    }).as('getMcp');

    cy.mount(
      <MemoryRouter>
        <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
          <SplitterProvider>
            <FeatureToggleProvider>
              <ControlPlaneCardV2
                controlPlane={managedControlPlane}
                workspace={workspace}
                projectName="projectName"
                useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
              />
            </FeatureToggleProvider>
          </SplitterProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>,
    );

    cy.wait('@getMcp');
    cy.contains('Installed Components (2)').should('exist');
    cy.get('[class*="componentIcon"]').should('have.length', 2);
  });

  it('displays empty state when no components installed', () => {
    const managedControlPlane: ControlPlaneListItem = {
      version: 'v2',
      metadata: {
        name: 'mcp-name',
        namespace: 'test-namespace',
        creationTimestamp: '2024-01-01T00:00:00Z',
        annotations: {},
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    };

    const workspace: Workspace = {
      metadata: {
        name: 'workspaceName',
        namespace: 'test-namespace',
        annotations: {},
      },
      spec: { members: [] },
      status: null,
    };

    cy.intercept('GET', '**/api/projects/*/workspaces/*/managedcontrolplanes/*', {
      statusCode: 200,
      body: {
        spec: {},
      },
    }).as('getMcp');

    cy.mount(
      <MemoryRouter>
        <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
          <SplitterProvider>
            <FeatureToggleProvider>
              <ControlPlaneCardV2
                controlPlane={managedControlPlane}
                workspace={workspace}
                projectName="projectName"
                useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
              />
            </FeatureToggleProvider>
          </SplitterProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>,
    );

    cy.wait('@getMcp');
    cy.contains('Installed Components (0)').should('exist');
    cy.contains('No components detected').should('exist');
  });

  it('renders emphasized Connect button', () => {
    const managedControlPlane: ControlPlaneListItem = {
      version: 'v2',
      metadata: {
        name: 'mcp-name',
        namespace: 'test-namespace',
        creationTimestamp: '2024-01-01T00:00:00Z',
        annotations: {},
      },
      status: {
        status: ReadyStatus.Ready,
        conditions: [],
        access: undefined,
      },
    };

    const workspace: Workspace = {
      metadata: {
        name: 'workspaceName',
        namespace: 'test-namespace',
        annotations: {},
      },
      spec: { members: [] },
      status: null,
    };

    cy.mount(
      <MemoryRouter>
        <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
          <SplitterProvider>
            <FeatureToggleProvider>
              <ControlPlaneCardV2
                controlPlane={managedControlPlane}
                workspace={workspace}
                projectName="projectName"
                useDeleteManagedControlPlane={fakeUseDeleteManagedControlPlane}
                useDeleteManagedControlPlaneV2GraphQL={fakeUseDeleteManagedControlPlaneV2GraphQL}
              />
            </FeatureToggleProvider>
          </SplitterProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>,
    );

    cy.contains('Connect').should('exist');
    cy.contains('Connect').parent('ui5-button').should('have.attr', 'design', 'Emphasized');
  });
});
