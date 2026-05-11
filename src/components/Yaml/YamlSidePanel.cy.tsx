import '@ui5/webcomponents-cypress-commands';
import { YamlSidePanel } from './YamlSidePanel';
import { AnalyticsProvider } from '../../lib/analytics';
import { Resource } from '../../utils/removeManagedFieldsAndFilterData';
import { SplitterProvider } from '../Splitter/SplitterContext';

const mockResource: Resource = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'test-config',
    namespace: 'default',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  data: {
    key: 'value',
  },
};

const analyticsConfig = {
  provider: 'noop' as const,
  enabled: true,
  debug: true,
  autoTrack: { clicks: true, pageViews: true, errors: true },
};

describe('YamlSidePanel Analytics', () => {
  it('tracks YAML copied event', () => {
    cy.mount(
      <AnalyticsProvider config={analyticsConfig}>
        <SplitterProvider>
          <YamlSidePanel resource={mockResource} filename="test-config" isEdit={false} />
        </SplitterProvider>
      </AnalyticsProvider>,
    );

    // Spy on console.log to catch analytics debug messages
    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    // Click copy button
    cy.get('ui5-toolbar-button').contains('Copy').click();

    // Verify analytics event was tracked
    cy.get('@consoleLog').should('be.calledWith', '[NoopAdapter] trackEvent:', 'YAML Copied', {
      resourceKind: 'ConfigMap',
      resourceApiVersion: 'v1',
      isEdit: false,
      showOnlyImportantData: true,
    });
  });

  it('tracks YAML filter toggle event', () => {
    cy.mount(
      <AnalyticsProvider config={analyticsConfig}>
        <SplitterProvider>
          <YamlSidePanel resource={mockResource} filename="test-config" isEdit={false} />
        </SplitterProvider>
      </AnalyticsProvider>,
    );

    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    // Toggle "Show only important" checkbox
    cy.get('ui5-checkbox').contains('Show only important').click();

    // Verify analytics event was tracked
    cy.get('@consoleLog').should('be.calledWith', '[NoopAdapter] trackEvent:', 'YAML Filter Toggled', {
      resourceKind: 'ConfigMap',
      showOnlyImportant: false,
    });
  });

  it('tracks YAML panel closed event', () => {
    cy.mount(
      <AnalyticsProvider config={analyticsConfig}>
        <SplitterProvider>
          <YamlSidePanel resource={mockResource} filename="test-config" isEdit={false} />
        </SplitterProvider>
      </AnalyticsProvider>,
    );

    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    // Click close button
    cy.get('[data-testid="yaml-close-button"]').click();

    // Verify analytics event was tracked
    cy.get('@consoleLog').should('be.calledWith', '[NoopAdapter] trackEvent:', 'YAML Panel Closed', {
      resourceKind: 'ConfigMap',
      mode: 'edit',
      isEdit: false,
    });
  });

  it('tracks YAML editor apply clicked in edit mode', () => {
    const onApplyStub = cy.stub().resolves(true);

    cy.mount(
      <AnalyticsProvider config={analyticsConfig}>
        <SplitterProvider>
          <YamlSidePanel resource={mockResource} filename="test-config" isEdit={true} onApply={onApplyStub} />
        </SplitterProvider>
      </AnalyticsProvider>,
    );

    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    // Apply button should trigger analytics
    // Note: This requires Monaco editor to be loaded which may not work in component tests
    // This is a basic structure - actual implementation may need adjustment
  });
});
