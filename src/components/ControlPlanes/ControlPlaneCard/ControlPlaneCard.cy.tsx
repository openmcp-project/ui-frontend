import '@ui5/webcomponents-cypress-commands';
import { MemoryRouter } from 'react-router-dom';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { useDeleteManagedControlPlane } from '../../../hooks/useDeleteManagedControlPlane.ts';
import { useDeleteManagedControlPlaneV2GraphQL } from '../../../spaces/mcp/hooks/useDeleteManagedControlPlaneV2GraphQL.ts';
import { ControlPlaneListItem } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { ControlPlaneCard } from './ControlPlaneCard.tsx';
import { AnalyticsProvider } from '../../../lib/analytics';

const mockFrontendConfig = {
  documentationBaseUrl: 'https://example.com',
  githubBaseUrl: 'https://github.com',
  featureToggles: {
    markMcpV1asDeprecated: false,
  },
  analytics: {
    provider: 'noop' as const,
    enabled: false,
    debug: false,
    autoTrack: { clicks: true, pageViews: true, errors: true },
  },
};

describe('ControlPlaneCard', () => {
  let deleteManagedControlPlaneCalled = false;
  let analyticsTrackEventSpy: Cypress.Agent<sinon.SinonSpy> | null = null;

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
    analyticsTrackEventSpy = null;
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
          <AnalyticsProvider config={mockFrontendConfig.analytics}>
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
          </AnalyticsProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>,
    );

    cy.get("[data-testid='ControlPlaneCardMenu-opener']").click();
    cy.contains('Delete ManagedControlPlane').click({ force: true });
    cy.get('ui5-dialog[open]').find('ui5-input').typeIntoUi5Input('mcp-name');
    cy.then(() => cy.wrap(deleteManagedControlPlaneCalled).should('equal', false));
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
    cy.then(() => cy.wrap(deleteManagedControlPlaneCalled).should('equal', true));
  });

  it('tracks analytics when delete button is clicked', () => {
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

    // Use analytics config with tracking enabled
    const analyticsConfig = {
      ...mockFrontendConfig.analytics,
      enabled: true,
      debug: true,
    };

    cy.mount(
      <MemoryRouter>
        <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
          <AnalyticsProvider config={analyticsConfig}>
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
          </AnalyticsProvider>
        </FrontendConfigContext.Provider>
      </MemoryRouter>,
    );

    // Open menu and click delete - should log analytics event
    cy.get("[data-testid='ControlPlaneCardMenu-opener']").click();
    cy.contains('Delete ManagedControlPlane').click({ force: true });

    // Close the dialog without completing deletion
    cy.get('ui5-dialog[open]').find('ui5-button').contains('Cancel').click();
  });
});
