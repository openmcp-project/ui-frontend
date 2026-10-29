import '@ui5/webcomponents-cypress-commands';
import { FeatureToggleProvider } from '../../../context/FeatureToggleContext.tsx';
import { FrontendConfigContext, defaultBranding } from '../../../context/FrontendConfigContext.tsx';
import { CreateControlPlaneButton } from './CreateControlPlaneButton.tsx';

const baseConfig = {
  documentationBaseUrl: '',
  githubBaseUrl: '',
  githubApps: [],
  feedbackUrl: null,
  branding: defaultBranding,
  featureToggles: {
    markMcpV1asDeprecated: false,
    enableMcpV2: false,
    enableHeadlamp: false,
    enableGitHub: false,
    showLandscaperCard: false,
  },
};

function mountButton({
  enableMcpV2 = false,
  markMcpV1asDeprecated = false,
  disabled = false,
  onCreateV1 = cy.stub(),
  onCreateV2 = cy.stub(),
}: {
  enableMcpV2?: boolean;
  markMcpV1asDeprecated?: boolean;
  disabled?: boolean;
  onCreateV1?: () => void;
  onCreateV2?: () => void;
} = {}) {
  const config = {
    ...baseConfig,
    featureToggles: { ...baseConfig.featureToggles, enableMcpV2, markMcpV1asDeprecated },
  };
  cy.mount(
    <FrontendConfigContext.Provider value={config}>
      <FeatureToggleProvider>
        <CreateControlPlaneButton disabled={disabled} onCreateV1={onCreateV1} onCreateV2={onCreateV2} />
      </FeatureToggleProvider>
    </FrontendConfigContext.Provider>,
  );
}

describe('CreateControlPlaneButton', () => {
  it('renders a plain button (no menu) when enableMcpV2 is false', () => {
    mountButton({ enableMcpV2: false });
    cy.get('[data-testid="create-control-plane-button"]').should('exist');
    cy.get('ui5-menu').should('not.exist');
  });

  it('calls onCreateV1 when plain button is clicked', () => {
    const onCreateV1 = cy.stub().as('onCreateV1');
    mountButton({ enableMcpV2: false, onCreateV1 });
    cy.get('[data-testid="create-control-plane-button"]').click();
    cy.get('@onCreateV1').should('have.been.calledOnce');
  });

  it('is disabled when disabled prop is true', () => {
    mountButton({ disabled: true });
    cy.get('[data-testid="create-control-plane-button"]').invoke('prop', 'disabled').should('equal', true);
  });

  it('renders a dropdown button (with menu) when enableMcpV2 is true', () => {
    mountButton({ enableMcpV2: true });
    cy.get('[data-testid="create-control-plane-button"]').should('exist');
    cy.get('[data-testid="create-control-plane-button"]').click();
    cy.get('ui5-menu[open]').should('exist');
  });

  it('calls onCreateV1 when the V1 menu item is clicked', () => {
    const onCreateV1 = cy.stub().as('onCreateV1');
    mountButton({ enableMcpV2: true, onCreateV1 });
    cy.get('[data-testid="create-control-plane-button"]').click();
    cy.get('ui5-menu-item[data-action="createV1"]').click();
    cy.get('@onCreateV1').should('have.been.calledOnce');
  });

  it('calls onCreateV2 when the V2 menu item is clicked', () => {
    const onCreateV2 = cy.stub().as('onCreateV2');
    mountButton({ enableMcpV2: true, onCreateV2 });
    cy.get('[data-testid="create-control-plane-button"]').click();
    cy.get('ui5-menu-item[data-action="createV2"]').click();
    cy.get('@onCreateV2').should('have.been.calledOnce');
  });

  it('shows Deprecated badge on V1 item when markMcpV1asDeprecated is true', () => {
    mountButton({ enableMcpV2: true, markMcpV1asDeprecated: true });
    cy.get('[data-testid="create-control-plane-button"]').click();
    cy.get('ui5-menu[open] ui5-menu-item[data-action="createV1"]')
      .invoke('attr', 'additional-text')
      .should('equal', 'Deprecated');
  });
});
