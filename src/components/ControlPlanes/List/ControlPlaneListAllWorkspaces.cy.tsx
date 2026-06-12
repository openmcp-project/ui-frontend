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

const fakeForbiddenMcpsQuery: typeof useMcpsQuery = () => ({
  data: [],
  error: Object.assign(new Error('is forbidden'), {
    graphQLErrors: [],
    networkError: null,
    clientErrors: [],
    cause: undefined,
    extraInfo: undefined,
    protocolErrors: [],
  }),
  isPending: false,
});

const fakeUseMcpsQueryForWorkspace =
  (forbiddenWorkspace: string): typeof useMcpsQuery =>
  (workspaceNamespace) => ({
    data: [],
    error: workspaceNamespace?.includes(forbiddenWorkspace)
      ? Object.assign(new Error('is forbidden'), {
          graphQLErrors: [],
          networkError: null,
          clientErrors: [],
          cause: undefined,
          extraInfo: undefined,
          protocolErrors: [],
        })
      : undefined,
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

function mountAllWorkspaces(ws: Workspace[], useMcpsQueryOverride: typeof useMcpsQuery = fakeUseMcpsQuery) {
  cy.mount(
    <FrontendConfigContext.Provider value={frontendConfig}>
      <MockedProvider mocks={[]}>
        <MemoryRouter>
          <FeatureToggleProvider>
            <SplitterProvider>
              <ControlPlaneListAllWorkspaces
                projectName="test"
                workspaces={ws}
                useMcpsQuery={useMcpsQueryOverride}
                useDeleteWorkspace={fakeUseDeleteWorkspace}
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

describe('ControlPlaneListAllWorkspaces — mutually exclusive expansion', () => {
  it('expands only the first workspace by default', () => {
    mountAllWorkspaces(workspaces);

    panel('alpha').invoke('prop', 'collapsed').should('equal', false);
    panel('beta').invoke('prop', 'collapsed').should('equal', true);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });

  it('skips forbidden workspaces when auto-expanding', () => {
    mountAllWorkspaces(workspaces, fakeForbiddenMcpsQuery);

    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
    panel('beta').invoke('prop', 'collapsed').should('equal', true);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });

  it('auto-expands second workspace when first is forbidden', () => {
    mountAllWorkspaces(workspaces, fakeUseMcpsQueryForWorkspace('alpha'));

    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
    panel('beta').invoke('prop', 'collapsed').should('equal', false);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });

  it('expanding a second workspace collapses the first', () => {
    mountAllWorkspaces(workspaces);

    togglePanel('beta');

    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
    panel('beta').invoke('prop', 'collapsed').should('equal', false);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });

  it('collapsing the expanded workspace leaves all panels collapsed', () => {
    mountAllWorkspaces(workspaces);

    togglePanel('alpha');

    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
    panel('beta').invoke('prop', 'collapsed').should('equal', true);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });

  it('renders empty state when there are no workspaces', () => {
    mountAllWorkspaces([]);

    cy.get('[data-testid^="workspace-panel-"]').should('not.exist');
    cy.get('ui5-illustrated-message').should('exist');
  });
});
