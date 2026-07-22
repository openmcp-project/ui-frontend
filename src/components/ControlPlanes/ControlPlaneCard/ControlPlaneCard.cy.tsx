import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { MemoryRouter } from 'react-router-dom';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { useDeleteManagedControlPlane } from '../../../hooks/useDeleteManagedControlPlane.ts';
import { useDeleteControlPlaneV2GraphQL } from '../../../spaces/controlPlaneV2/hooks/useDeleteControlPlaneV2GraphQL.ts';
import { ControlPlaneListItem } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { ControlPlaneCard } from './ControlPlaneCard.tsx';

TimeAgo.addDefaultLocale(en);

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
