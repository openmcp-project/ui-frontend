import { MockedProvider } from '@apollo/client/testing/react';
import '@ui5/webcomponents-cypress-commands';
import { MemoryRouter } from 'react-router-dom';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext, Landscape } from '../../../context/FrontendConfigContext.tsx';
import { useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { SplitterProvider } from '../../Splitter/SplitterContext.tsx';
import ControlPlaneListAllWorkspaces from './ControlPlaneListAllWorkspaces.tsx';

const frontendConfig = {
  landscape: Landscape.Local,
  documentationBaseUrl: 'http://localhost:3000',
  githubBaseUrl: 'https://github.com/example/repo',
  featureToggles: { markMcpV1asDeprecated: false, enableMcpV2: false },
};

const fakeUseMcpsQuery: typeof useMcpsQuery = () => ({
  data: [],
  error: undefined,
  isPending: false,
});

const fakeUseDeleteWorkspace: typeof useDeleteWorkspace = () => ({
  deleteWorkspace: async () => undefined,
});

const makeWorkspace = (name: string): Workspace => ({
  metadata: {
    name,
    namespace: `project-test--ws-${name}`,
    annotations: {},
  },
  spec: { members: [] },
  status: { namespace: `project-test--ws-${name}` },
});

const workspaces = [makeWorkspace('alpha'), makeWorkspace('beta'), makeWorkspace('gamma')];

function mountAllWorkspaces(ws: Workspace[]) {
  cy.mount(
    <FrontendConfigContext.Provider value={frontendConfig}>
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <FeatureToggleProvider>
            <SplitterProvider>
              <ControlPlaneListAllWorkspaces
                projectName="test"
                workspaces={ws}
                useMcpsQuery={fakeUseMcpsQuery}
                useDeleteWorkspace={fakeUseDeleteWorkspace}
              />
            </SplitterProvider>
          </FeatureToggleProvider>
        </MemoryRouter>
      </MockedProvider>
    </FrontendConfigContext.Provider>,
  );
}

describe('ControlPlaneListAllWorkspaces — mutually exclusive expansion', () => {
  it('expands only the first workspace by default', () => {
    mountAllWorkspaces(workspaces);

    cy.get('ui5-panel').eq(0).invoke('prop', 'collapsed').should('equal', false);
    cy.get('ui5-panel').eq(1).invoke('prop', 'collapsed').should('equal', true);
    cy.get('ui5-panel').eq(2).invoke('prop', 'collapsed').should('equal', true);
  });

  it('expanding a second workspace collapses the first', () => {
    mountAllWorkspaces(workspaces);

    cy.get('ui5-panel').eq(1).shadow().find('ui5-button.ui5-panel-header-button').click({ force: true });

    cy.get('ui5-panel').eq(0).invoke('prop', 'collapsed').should('equal', true);
    cy.get('ui5-panel').eq(1).invoke('prop', 'collapsed').should('equal', false);
    cy.get('ui5-panel').eq(2).invoke('prop', 'collapsed').should('equal', true);
  });

  it('collapsing the expanded workspace leaves all panels collapsed', () => {
    mountAllWorkspaces(workspaces);

    cy.get('ui5-panel').eq(0).shadow().find('ui5-button.ui5-panel-header-button').click({ force: true });

    cy.get('ui5-panel').eq(0).invoke('prop', 'collapsed').should('equal', true);
    cy.get('ui5-panel').eq(1).invoke('prop', 'collapsed').should('equal', true);
    cy.get('ui5-panel').eq(2).invoke('prop', 'collapsed').should('equal', true);
  });

  it('renders empty state when there are no workspaces', () => {
    mountAllWorkspaces([]);

    cy.get('ui5-panel').should('not.exist');
    cy.get('ui5-illustrated-message').should('exist');
  });
});
