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
import { getExpandedWorkspaces, setExpandedWorkspaces } from '../../../utils/expandedWorkspace.ts';

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

describe('ControlPlaneListAllWorkspaces — independent expansion', () => {
  beforeEach(() => {
    setExpandedWorkspaces('test', new Set());
  });

  it('all workspaces start collapsed when no localStorage state', () => {
    mountAllWorkspaces(workspaces);

    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
    panel('beta').invoke('prop', 'collapsed').should('equal', true);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });

  it('expanding one workspace does not collapse others', () => {
    mountAllWorkspaces(workspaces);

    togglePanel('alpha');
    togglePanel('beta');

    panel('alpha').invoke('prop', 'collapsed').should('equal', false);
    panel('beta').invoke('prop', 'collapsed').should('equal', false);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });

  it('collapsing a workspace does not affect others', () => {
    setExpandedWorkspaces('test', new Set(['alpha', 'beta']));
    mountAllWorkspaces(workspaces);

    togglePanel('alpha');

    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
    panel('beta').invoke('prop', 'collapsed').should('equal', false);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });
});

describe('ControlPlaneListAllWorkspaces — expand/collapse all', () => {
  beforeEach(() => {
    setExpandedWorkspaces('test', new Set());
  });

  it('shows expand all button when not all expanded', () => {
    mountAllWorkspaces(workspaces);
    cy.contains('Expand all').should('be.visible');
  });

  it('expand all expands all workspaces', () => {
    mountAllWorkspaces(workspaces);

    cy.contains('Expand all').click();

    panel('alpha').invoke('prop', 'collapsed').should('equal', false);
    panel('beta').invoke('prop', 'collapsed').should('equal', false);
    panel('gamma').invoke('prop', 'collapsed').should('equal', false);
  });

  it('shows collapse all button when all expanded', () => {
    setExpandedWorkspaces('test', new Set(['alpha', 'beta', 'gamma']));
    mountAllWorkspaces(workspaces);
    cy.contains('Collapse all').should('be.visible');
  });

  it('collapse all collapses all workspaces', () => {
    setExpandedWorkspaces('test', new Set(['alpha', 'beta', 'gamma']));
    mountAllWorkspaces(workspaces);

    cy.contains('Collapse all').click();

    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
    panel('beta').invoke('prop', 'collapsed').should('equal', true);
    panel('gamma').invoke('prop', 'collapsed').should('equal', true);
  });
});

describe('ControlPlaneListAllWorkspaces — localStorage persistence', () => {
  beforeEach(() => {
    setExpandedWorkspaces('test', new Set());
  });

  it('restores previously expanded workspaces on mount', () => {
    setExpandedWorkspaces('test', new Set(['beta', 'gamma']));
    mountAllWorkspaces(workspaces);

    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
    panel('beta').invoke('prop', 'collapsed').should('equal', false);
    panel('gamma').invoke('prop', 'collapsed').should('equal', false);
  });

  it('persists expansion to localStorage', () => {
    mountAllWorkspaces(workspaces);

    togglePanel('gamma');

    cy.wrap(null).should(() => {
      const stored = getExpandedWorkspaces('test');
      expect(stored.has('gamma')).to.equal(true);
    });
  });

  it('removes workspace from localStorage when collapsed', () => {
    setExpandedWorkspaces('test', new Set(['alpha']));
    mountAllWorkspaces(workspaces);

    togglePanel('alpha');

    cy.wrap(null).should(() => {
      const stored = getExpandedWorkspaces('test');
      expect(stored.has('alpha')).to.equal(false);
    });
  });

  it('ignores stored workspaces that no longer exist', () => {
    setExpandedWorkspaces('test', new Set(['deleted-ws', 'beta']));
    mountAllWorkspaces(workspaces);

    panel('beta').invoke('prop', 'collapsed').should('equal', false);
    panel('alpha').invoke('prop', 'collapsed').should('equal', true);
  });
});
