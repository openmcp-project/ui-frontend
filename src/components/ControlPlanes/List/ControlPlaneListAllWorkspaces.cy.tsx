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
  featureToggles: { markMcpV1asDeprecated: false, enableMcpV2: false, enableHeadlamp: false },
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
  metadata: { name, namespace: `project-test--ws-${name}`, annotations: {} },
  spec: { members: [] },
  status: { namespace: `project-test--ws-${name}` },
});

const workspaces = [makeWorkspace('alpha'), makeWorkspace('beta'), makeWorkspace('gamma')];

function mountAllWorkspaces(
  ws: Workspace[],
  expandedWorkspaces: Set<string> = new Set(),
  onToggleWorkspace: (name: string) => void = cy.stub(),
) {
  cy.mount(
    <FrontendConfigContext.Provider value={frontendConfig}>
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <FeatureToggleProvider>
            <SplitterProvider>
              <ControlPlaneListAllWorkspaces
                projectName="test"
                workspaces={ws}
                expandedWorkspaces={expandedWorkspaces}
                useMcpsQuery={fakeUseMcpsQuery}
                useDeleteWorkspace={fakeUseDeleteWorkspace}
                onToggleWorkspace={onToggleWorkspace}
              />
            </SplitterProvider>
          </FeatureToggleProvider>
        </MemoryRouter>
      </MockedProvider>
    </FrontendConfigContext.Provider>,
  );
}

function panel(name: string) {
  return cy.get(`[data-testid="workspace-panel-${name}"]`);
}

function togglePanel(name: string) {
  panel(name).then(($el: JQuery<HTMLElement>) => $el[0].dispatchEvent(new CustomEvent('toggle', { bubbles: true })));
}

describe('ControlPlaneListAllWorkspaces — expansion via props', () => {
  it('all workspaces start collapsed when expandedWorkspaces is empty', () => {
    mountAllWorkspaces(workspaces, new Set());

    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
    panel('beta').invoke('prop', 'collapsed').should('equal', true);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });

  it('expands workspaces that are in expandedWorkspaces', () => {
    mountAllWorkspaces(workspaces, new Set(['alpha', 'gamma']));

    panel('alpha').invoke('prop', 'collapsed').should('equal', false);
    panel('beta').invoke('prop', 'collapsed').should('equal', true);
    panel('gamma').invoke('prop', 'collapsed').should('equal', false);
  });

  it('expands all when all names are in expandedWorkspaces', () => {
    mountAllWorkspaces(workspaces, new Set(['alpha', 'beta', 'gamma']));

    panel('alpha').invoke('prop', 'collapsed').should('equal', false);
    panel('beta').invoke('prop', 'collapsed').should('equal', false);
    panel('gamma').invoke('prop', 'collapsed').should('equal', false);
  });
});

describe('ControlPlaneListAllWorkspaces — toggle callback', () => {
  it('calls onToggleWorkspace with workspace name when panel is toggled', () => {
    const onToggle = cy.stub().as('onToggle');
    mountAllWorkspaces(workspaces, new Set(), onToggle);

    togglePanel('beta');

    cy.get('@onToggle').should('have.been.calledOnceWith', 'beta');
  });

  it('calls onToggleWorkspace for each toggle independently', () => {
    const onToggle = cy.stub().as('onToggle');
    mountAllWorkspaces(workspaces, new Set(['alpha', 'beta']), onToggle);

    togglePanel('alpha');
    togglePanel('gamma');

    cy.get('@onToggle').should('have.been.calledTwice');
    cy.get('@onToggle').its('firstCall.args.0').should('equal', 'alpha');
    cy.get('@onToggle').its('secondCall.args.0').should('equal', 'gamma');
  });
});

describe('ControlPlaneListAllWorkspaces — empty state', () => {
  it('renders empty state when there are no workspaces', () => {
    mountAllWorkspaces([], new Set());

    cy.get('[data-testid^="workspace-panel-"]').should('not.exist');
    cy.get('ui5-illustrated-message').should('exist');
  });
});
