import { MemoryRouter } from 'react-router-dom';
import Graph from './Graph.tsx';
import { ApiConfigProvider } from '../Shared/k8s';
import { SplitterProvider } from '../Splitter/SplitterContext.tsx';
import type { ManagedResourceItem } from '../../lib/shared/types.ts';
import '@ui5/webcomponents-cypress-commands';

// Build a synthetic ManagedResources payload with `total` items: one Subaccount
// at the root plus children of varying kinds that reference it via
// `subaccountRef`. This produces a wide hub-and-spoke layout whose ELK-computed
// bounding box far exceeds the Cypress viewport at the Graph's `minZoom=0.05`,
// which is what forces `onlyRenderVisibleElements` to actually cull.
const buildManagedResources = (total: number) => {
  const items: ManagedResourceItem[] = [];
  const apiVersion = 'account.btp.sap.crossplane.io/v1alpha1';
  const childKinds = [
    'ServiceInstance',
    'CloudFoundryEnvironment',
    'KymaEnvironment',
    'CloudManagement',
    'Entitlement',
  ];

  items.push({
    kind: 'Subaccount',
    apiVersion,
    metadata: {
      name: 'subaccount-root',
      creationTimestamp: '2024-01-01T00:00:00Z',
      resourceVersion: '1',
      labels: {},
    },
    spec: {},
    status: {
      conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: '2024-01-01T00:00:00Z' }],
    },
  });

  for (let i = 1; i < total; i++) {
    const kind = childKinds[i % childKinds.length];
    items.push({
      kind,
      apiVersion,
      metadata: {
        name: `${kind.toLowerCase()}-${i}`,
        creationTimestamp: '2024-01-01T00:00:00Z',
        resourceVersion: String(i),
        labels: {},
      },
      spec: {
        forProvider: { subaccountRef: { name: 'subaccount-root' } },
      },
      status: {
        conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: '2024-01-01T00:00:00Z' }],
      },
    });
  }

  return [{ items }];
};

describe('Graph viewport culling', () => {
  beforeEach(() => {
    // Empty CRD list means useProvidersConfigResource resolves to []
    // without firing any per-group /providerconfigs requests.
    cy.intercept('GET', '/api/onboarding/apis/apiextensions.k8s.io/v1/customresourcedefinitions', {
      statusCode: 200,
      body: { items: [] },
    }).as('crds');

    cy.intercept('GET', '/api/onboarding/managed', {
      statusCode: 200,
      body: buildManagedResources(500),
    }).as('managed');
  });

  it('renders far fewer DOM nodes than items when many are off-viewport', () => {
    cy.viewport(1280, 800);

    cy.mount(
      <MemoryRouter>
        <ApiConfigProvider apiConfig={{ mcpConfig: undefined }}>
          <SplitterProvider>
            <Graph />
          </SplitterProvider>
        </ApiConfigProvider>
      </MemoryRouter>,
    );

    cy.wait(['@managed', '@crds']);

    // Wait until ELK has laid the graph out and ReactFlow has rendered at
    // least some nodes. Allow extra time because elkjs on 500 nodes is not
    // instant in CI.
    cy.get('.react-flow__node', { timeout: 30000 }).should('have.length.greaterThan', 0);

    // Let fitView's 200 ms animation finish so all nodes are settled in the
    // viewport.
    cy.wait(500);

    // At minZoom=0.05 with fitView, the entire 500-node graph fits in 1280x800
    // and every node intersects the viewport — so culling has nothing to do.
    // Zoom in until the layout is much larger than the viewport; that is the
    // realistic interactive state where `onlyRenderVisibleElements` actually
    // matters. Each click of the ReactFlow zoom-in button doubles the zoom.
    for (let i = 0; i < 8; i++) {
      cy.get('.react-flow__controls-zoomin').click({ force: true });
    }

    // Give ReactFlow a frame to apply virtualization after the final zoom.
    cy.wait(300);

    cy.get('.react-flow__node').then(($nodes) => {
      // With the graph zoomed well past fitView, the active DOM should hold
      // significantly fewer than 500 nodes — that's the whole point of
      // `onlyRenderVisibleElements`.
      expect($nodes.length).to.be.lessThan(300);
      expect($nodes.length).to.be.greaterThan(0);
    });
  });
});
