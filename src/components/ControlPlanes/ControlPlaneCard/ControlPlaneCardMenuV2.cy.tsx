import '@ui5/webcomponents-cypress-commands';
import { MockedProvider } from '@apollo/client/testing/react';
import type { ComponentProps } from 'react';
import { ControlPlaneCardMenuV2 } from './ControlPlaneCardMenuV2';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { GET_KUBECONFIG_QUERY } from '../../../spaces/onboarding/hooks/useKubeconfigQuery.ts';
import type { ControlPlaneStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { useToast } from '../../../context/ToastContext.tsx';

const NAMESPACE = 'my-namespace';
const CONTROL_PLANE_NAME = 'my-mcp';

const mockFrontendConfig = {
  documentationBaseUrl: 'https://example.com',
  githubBaseUrl: 'https://github.com',
  featureToggles: { markMcpV1asDeprecated: false },
};

const kubeconfigYaml = (user: string) => `apiVersion: v1\nkind: Config\nusers:\n- name: ${user}\n`;

/** One MockedProvider entry per IdP secret, keyed by the per-IdP secret name. */
function kubeconfigMocks(secrets: { secretName: string; user: string; onResult?: () => void }[]) {
  return secrets.map(({ secretName, user, onResult }) => ({
    request: {
      query: GET_KUBECONFIG_QUERY,
      variables: { kubeConfigName: secretName, namespaceName: NAMESPACE },
    },
    result: () => {
      onResult?.();
      return { data: { v1: { Secret: { data: { kubeconfig: btoa(kubeconfigYaml(user)) } } } } };
    },
  }));
}

const baseProps = {
  setDialogDeleteMcpIsOpen: () => {},
  isDeleteMcpButtonDisabled: false,
  setIsEditManagedControlPlaneWizardOpen: () => {},
  controlPlaneName: CONTROL_PLANE_NAME,
  mcpNamespace: NAMESPACE,
  // Default to a no-op toast so tests don't need a ToastProvider; error test overrides it.
  useToast: (() => ({ show: () => {} })) as typeof useToast,
};

const mockUseTelemetryWith = (trackSpy: Cypress.Agent<sinon.SinonStub>): typeof useTelemetry => {
  return () => ({ track: trackSpy, report: cy.stub(), breadcrumb: cy.stub(), identify: cy.stub() });
};

const mockUseToastWith = (showSpy: Cypress.Agent<sinon.SinonStub>): typeof useToast => {
  return () => ({ show: showSpy });
};

const mount = (
  access: ControlPlaneStatus['access'],
  mocks: readonly unknown[],
  extraProps: Partial<ComponentProps<typeof ControlPlaneCardMenuV2>> = {},
) =>
  cy.mount(
    <FrontendConfigContext.Provider value={mockFrontendConfig as never}>
      <MockedProvider mocks={mocks as never}>
        <ControlPlaneCardMenuV2 {...baseProps} access={access} {...extraProps} />
      </MockedProvider>
    </FrontendConfigContext.Provider>,
  );

const openMenu = () => cy.get('[data-testid="ControlPlaneCardMenuV2-opener"]').click();

describe('ControlPlaneCardMenuV2', () => {
  beforeEach(() => {
    // Spy the blob-download side effect without producing real files.
    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').as('createObjectURL').returns('blob:fake');
      cy.stub(win.URL, 'revokeObjectURL');
    });
  });

  it('downloads directly (no submenu) when only the system IdP exists', () => {
    let requestCount = 0;
    const access = { oidc_openmcp: { name: 'secret-openmcp' } } as ControlPlaneStatus['access'];
    mount(
      access,
      kubeconfigMocks([{ secretName: 'secret-openmcp', user: 'openmcp', onResult: () => (requestCount += 1) }]),
    );

    openMenu();
    cy.get('ui5-menu-item[data-idp-key="oidc_openmcp"]').click();

    cy.get('@createObjectURL').should('have.been.calledOnce');
    cy.then(() => expect(requestCount).to.equal(1));
  });

  it('does NOT fetch any kubeconfig until an IdP leaf is clicked', () => {
    let requestCount = 0;
    const access = {
      oidc_openmcp: { name: 'secret-openmcp' },
      'oidc_my-corp-idp': { name: 'secret-corp' },
    } as ControlPlaneStatus['access'];
    mount(
      access,
      kubeconfigMocks([
        { secretName: 'secret-openmcp', user: 'openmcp', onResult: () => (requestCount += 1) },
        { secretName: 'secret-corp', user: 'my-corp-idp', onResult: () => (requestCount += 1) },
      ]),
    );

    openMenu();
    cy.get('ui5-menu[open]').should('exist');
    cy.then(() => expect(requestCount).to.equal(0));
  });

  it('shows a submenu with system (default IdP) and custom (custom IdP) entries', () => {
    const access = {
      oidc_openmcp: { name: 'secret-openmcp' },
      'oidc_my-corp-idp': { name: 'secret-corp' },
    } as ControlPlaneStatus['access'];
    mount(
      access,
      kubeconfigMocks([
        { secretName: 'secret-openmcp', user: 'openmcp' },
        { secretName: 'secret-corp', user: 'my-corp-idp' },
      ]),
    );

    openMenu();
    cy.get('[data-testid="download-kubeconfig-parent"]').click();

    cy.contains('openmcp').should('be.visible');
    cy.contains('my-corp-idp').should('be.visible');
    cy.contains('default IdP').should('exist');
    cy.contains('custom IdP').should('exist');
  });

  it('fetches the CUSTOM IdP secret when its submenu leaf is clicked (map-key vs secret-name)', () => {
    // Bubbling guard: if a future UI5 upgrade stops surfacing nested-submenu clicks on the
    // root Menu, this fetch never fires and the test fails loudly.
    let corpRequested = false;
    const access = {
      oidc_openmcp: { name: 'secret-openmcp' },
      'oidc_my-corp-idp': { name: 'secret-corp' },
    } as ControlPlaneStatus['access'];
    mount(
      access,
      kubeconfigMocks([
        { secretName: 'secret-openmcp', user: 'openmcp' },
        { secretName: 'secret-corp', user: 'my-corp-idp', onResult: () => (corpRequested = true) },
      ]),
    );

    openMenu();
    cy.get('[data-testid="download-kubeconfig-parent"]').click();
    cy.get('ui5-menu-item[data-idp-key="oidc_my-corp-idp"]').click();

    cy.get('@createObjectURL').should('have.been.calledOnce');
    cy.then(() => expect(corpRequested).to.equal(true));
  });

  it('tracks kubeconfig.downloaded after a successful download', () => {
    const trackSpy = cy.stub().as('trackSpy');
    const access = { oidc_openmcp: { name: 'secret-openmcp' } } as ControlPlaneStatus['access'];
    mount(access, kubeconfigMocks([{ secretName: 'secret-openmcp', user: 'openmcp' }]), {
      useTelemetry: mockUseTelemetryWith(trackSpy),
    });

    openMenu();
    cy.get('ui5-menu-item[data-idp-key="oidc_openmcp"]').click();

    cy.get('@trackSpy').should('have.been.calledWith', {
      category: 'kubeconfig',
      action: 'downloaded',
      source: 'controlplane-card',
    });
  });

  it('shows an error toast and does not track when the fetch fails', () => {
    const trackSpy = cy.stub().as('trackSpy');
    const showSpy = cy.stub().as('showSpy');
    const access = { oidc_openmcp: { name: 'secret-openmcp' } } as ControlPlaneStatus['access'];
    const errorMock = [
      {
        request: {
          query: GET_KUBECONFIG_QUERY,
          variables: { kubeConfigName: 'secret-openmcp', namespaceName: NAMESPACE },
        },
        error: new Error('network down'),
      },
    ];

    mount(access, errorMock, {
      useTelemetry: mockUseTelemetryWith(trackSpy),
      useToast: mockUseToastWith(showSpy),
    });

    openMenu();
    cy.get('ui5-menu-item[data-idp-key="oidc_openmcp"]').click();

    cy.get('@showSpy').should('have.been.calledOnce');
    cy.get('@trackSpy').should('not.have.been.called');
    cy.get('@createObjectURL').should('not.have.been.called');
  });

  it('disables edit and delete when isDeleteMcpButtonDisabled is true', () => {
    const access = { oidc_openmcp: { name: 'secret-openmcp' } } as ControlPlaneStatus['access'];
    mount(access, kubeconfigMocks([{ secretName: 'secret-openmcp', user: 'openmcp' }]), {
      isDeleteMcpButtonDisabled: true,
    });

    openMenu();
    cy.get('ui5-menu-item[data-action="editMcp"]').invoke('prop', 'disabled').should('equal', true);
    cy.get('ui5-menu-item[data-action="deleteMcp"]').invoke('prop', 'disabled').should('equal', true);
  });
});
