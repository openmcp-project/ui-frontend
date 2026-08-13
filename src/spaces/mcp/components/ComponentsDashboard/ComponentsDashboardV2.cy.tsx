import { MockedProvider } from '@apollo/client/testing/react';

import { FrontendConfigContext, Landscape } from '../../../../context/FrontendConfigContext.tsx';
import { FeatureToggleProvider } from '../../../../context/FeatureToggleContext.tsx';
import { ToastProvider } from '../../../../context/ToastContext.tsx';
import type { CrossplaneData } from '../../types/Crossplane.ts';
import type { EsoData } from '../../types/Eso.ts';
import type { FluxData } from '../../types/Flux.ts';
import type { KroData } from '../../types/Kro.ts';
import type { LandscaperData } from '../../types/Landscaper.ts';
import type { OcmData } from '../../types/Ocm.ts';
import { ComponentsDashboardV2, ComponentsDashboardV2Props } from './ComponentsDashboardV2.tsx';

const frontendConfig = {
  landscape: Landscape.Local,
  documentationBaseUrl: '',
  githubBaseUrl: '',
  featureToggles: { markMcpV1asDeprecated: false, enableMcpV2: true, enableHeadlamp: false, showLandscaperCard: false },
};

const frontendConfigWithLandscaper = {
  ...frontendConfig,
  featureToggles: { ...frontendConfig.featureToggles, showLandscaperCard: true },
};

describe('ComponentsDashboardV2', () => {
  const crossplaneInstalled: CrossplaneData = { isInstalled: true, version: '1.2.3', providers: [] };
  const fluxInstalled: FluxData = { isInstalled: true, version: '2.0.0' };
  const landscaperInstalled: LandscaperData = { isInstalled: true, version: '3.0.0' };
  const esoInstalled: EsoData = { isInstalled: true, version: '4.0.0' };
  const ocmInstalled: OcmData = { isInstalled: true, version: '5.0.0' };
  const kroInstalled: KroData = { isInstalled: true, version: '6.0.0' };

  const mount = (props?: Partial<ComponentsDashboardV2Props>) => {
    cy.mount(
      <FrontendConfigContext.Provider value={frontendConfig}>
        <MockedProvider mocks={[]}>
          <FeatureToggleProvider>
            <ToastProvider>
              <ComponentsDashboardV2
                crossplaneData={null}
                landscaperData={null}
                fluxData={null}
                esoData={null}
                ocmData={null}
                kroData={null}
                mcpName="my-mcp"
                mcpNamespace="project-foo--ws-bar"
                onNavigateToMcpSection={() => {}}
                {...props}
              />
            </ToastProvider>
          </FeatureToggleProvider>
        </MockedProvider>
      </FrontendConfigContext.Provider>,
      {},
    );
  };

  const mountWithLandscaper = (props?: Partial<ComponentsDashboardV2Props>) => {
    cy.mount(
      <FrontendConfigContext.Provider value={frontendConfigWithLandscaper}>
        <MockedProvider mocks={[]}>
          <FeatureToggleProvider>
            <ToastProvider>
              <ComponentsDashboardV2
                crossplaneData={null}
                landscaperData={null}
                fluxData={null}
                esoData={null}
                ocmData={null}
                kroData={null}
                mcpName="my-mcp"
                mcpNamespace="project-foo--ws-bar"
                onNavigateToMcpSection={() => {}}
                {...props}
              />
            </ToastProvider>
          </FeatureToggleProvider>
        </MockedProvider>
      </FrontendConfigContext.Provider>,
      {},
    );
  };

  it('renders all six component cards with names, descriptions, and versions', () => {
    mountWithLandscaper({
      crossplaneData: crossplaneInstalled,
      fluxData: fluxInstalled,
      landscaperData: landscaperInstalled,
      esoData: esoInstalled,
      ocmData: ocmInstalled,
      kroData: kroInstalled,
    });

    cy.get('.ui5-card-header').should('have.length', 6);
    cy.get('.ui5-card-header').eq(0).should('contain.text', 'Crossplane').and('contain.text', 'v1.2.3');
    cy.get('.ui5-card-header').eq(1).should('contain.text', 'Flux').and('contain.text', 'v2.0.0');
    cy.get('.ui5-card-header').eq(2).should('contain.text', 'Landscaper').and('contain.text', 'v3.0.0');
    cy.get('.ui5-card-header').eq(3).should('contain.text', 'External Secrets Operator').and('contain.text', 'v4.0.0');
    cy.get('.ui5-card-header').eq(4).should('contain.text', 'OCM').and('contain.text', 'v5.0.0');
    cy.get('.ui5-card-header').eq(5).should('contain.text', 'KRO').and('contain.text', 'v6.0.0');
  });

  it('does not render the yamlViewButton slot before the status query has resolved a resource', () => {
    mount({ crossplaneData: crossplaneInstalled });

    // MockedProvider has no mocks configured, so the status query never resolves a resource -
    // the YAML button must stay hidden rather than falling back to a second, duplicate fetch.
    cy.get('[data-cy="yaml-view-button"]').should('not.exist');
  });

  it('opens the Crossplane install dialog from the Install button', () => {
    mount();

    cy.get('[data-cy="component-card-crossplane"]').within(() => {
      cy.get('[data-cy="install-button"]').click();
    });

    cy.contains('Install Crossplane').should('be.visible');
  });

  it('opens the Flux install dialog from the Install button', () => {
    mount();

    cy.get('[data-cy="component-card-flux"]').within(() => {
      cy.get('[data-cy="install-button"]').click();
    });

    cy.contains('Install Flux').should('be.visible');
  });

  it('opens the Landscaper edit dialog from the actions menu when installed', () => {
    mountWithLandscaper({ landscaperData: landscaperInstalled });

    cy.get('[data-cy="component-card-landscaper"]').within(() => {
      cy.get('[data-cy="actions-menu-button"]').click();
    });
    cy.get('[data-cy="edit-menu-item"]').click();

    cy.contains('Edit Landscaper').should('be.visible');
  });

  it('opens the delete confirmation dialog for External Secrets Operator from the actions menu', () => {
    mount({ esoData: esoInstalled });

    cy.get('[data-cy="component-card-eso"]').within(() => {
      cy.get('[data-cy="actions-menu-button"]').click();
    });
    cy.get('[data-cy="delete-menu-item"]').click();

    cy.contains('Delete External Secrets Operator').should('be.visible');
  });

  it('opens the OCM install dialog from the Install button', () => {
    mount();

    cy.get('[data-cy="component-card-ocm"]').within(() => {
      cy.get('[data-cy="install-button"]').click();
    });

    cy.contains('Install OCM').should('be.visible');
  });

  it('opens the delete confirmation dialog for KRO from the actions menu', () => {
    mount({ kroData: kroInstalled });

    cy.get('[data-cy="component-card-kro"]').within(() => {
      cy.get('[data-cy="actions-menu-button"]').click();
    });
    cy.get('[data-cy="delete-menu-item"]').click();

    cy.contains('Delete KRO').should('be.visible');
  });
});
