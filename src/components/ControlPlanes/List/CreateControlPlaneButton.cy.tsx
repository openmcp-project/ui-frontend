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
    enableHeadlamp: false,
    enableGitHub: false,
    showLandscaperCard: false,
  },
};

function mountButton({
  disabled = false,
  onCreate = cy.stub(),
}: {
  disabled?: boolean;
  onCreate?: () => void;
} = {}) {
  cy.mount(
    <FrontendConfigContext.Provider value={baseConfig}>
      <FeatureToggleProvider>
        <CreateControlPlaneButton disabled={disabled} onCreate={onCreate} />
      </FeatureToggleProvider>
    </FrontendConfigContext.Provider>,
  );
}

describe('CreateControlPlaneButton', () => {
  it('renders a plain button (no menu)', () => {
    mountButton();
    cy.get('[data-testid="create-control-plane-button"]').should('exist');
    cy.get('ui5-menu').should('not.exist');
  });

  it('calls onCreate when the button is clicked', () => {
    const onCreate = cy.stub().as('onCreate');
    mountButton({ onCreate });
    cy.get('[data-testid="create-control-plane-button"]').click();
    cy.get('@onCreate').should('have.been.calledOnce');
  });

  it('is disabled when disabled prop is true', () => {
    mountButton({ disabled: true });
    cy.get('[data-testid="create-control-plane-button"]').invoke('prop', 'disabled').should('equal', true);
  });
});
