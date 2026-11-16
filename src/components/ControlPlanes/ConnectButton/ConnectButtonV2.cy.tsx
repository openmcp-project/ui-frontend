import { MemoryRouter } from 'react-router-dom';
import ConnectButtonV2 from './ConnectButtonV2.tsx';
import { clearAllDenied, rememberDenied } from '../../../lib/api/access/downstreamAccessStore.ts';
import { FrontendConfigContext } from '../../../context/FrontendConfigContext.tsx';
import { mockedFrontendConfig } from '../../../utils/testing.ts';

function mountButton() {
  cy.mount(
    <FrontendConfigContext.Provider value={mockedFrontendConfig}>
      <MemoryRouter>
        <ConnectButtonV2
          projectName="p"
          workspaceName="w"
          controlPlaneName="cp"
          access={{ oidc_openmcp: { name: 'default-secret' }, oidc_custom: { name: 'custom-secret' } }}
        />
      </MemoryRouter>
    </FrontendConfigContext.Provider>,
  );
}

describe('v2 connect access', () => {
  beforeEach(() => clearAllDenied());

  it('enables unknown access and disables only the denied IdP', () => {
    rememberDenied('p/w/cp/custom');
    mountButton();
    cy.get('[data-testid="connect-button"]').should('have.prop', 'disabled', false).click();
    cy.get('ui5-menu-item[text="openmcp"]').should('have.prop', 'disabled', false);
    cy.get('ui5-menu-item[text="custom"]')
      .should('have.prop', 'disabled', true)
      .and('have.prop', 'additionalText', 'No access');
  });

  it('re-enables an already mounted button at expiry', () => {
    cy.clock(Date.now(), ['Date', 'setTimeout', 'clearTimeout']);
    cy.then(() => {
      rememberDenied('p/w/cp/openmcp');
      rememberDenied('p/w/cp/custom');
    });
    mountButton();
    cy.get('[data-testid="connect-button"]')
      .should('have.prop', 'disabled', true)
      .and('have.attr', 'title', 'No access to this control plane');
    cy.tick(15 * 60_000);
    cy.get('[data-testid="connect-button"]').should('have.prop', 'disabled', false);
  });
});
