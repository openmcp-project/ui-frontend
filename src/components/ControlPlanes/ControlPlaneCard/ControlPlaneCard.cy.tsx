import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import { ListControlPlanesType } from '../../../lib/api/types/crate/controlPlanes.ts';
import { MemoryRouter } from 'react-router-dom';
import '@ui5/webcomponents-cypress-commands';
import { ControlPlaneCard } from './ControlPlaneCard.tsx';
import { useDeleteManagedControlPlane } from '../../../hooks/useDeleteManagedControlPlane.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';

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

  beforeEach(() => {
    deleteManagedControlPlaneCalled = false;
  });

  it('deletes the workspace', () => {
    const managedControlPlane: ListControlPlanesType = {
      metadata: {
        name: 'mcp-name',
      },
    } as unknown as ListControlPlanesType;

    const workspace: Workspace = {
      metadata: {
        name: 'workspaceName',
      },
    } as unknown as Workspace;

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
              />
            </FeatureToggleProvider>
          </SplitterProvider>
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
});
