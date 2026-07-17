import { MockedProvider } from '@apollo/client/testing/react';

import { ToastProvider } from '../../../../context/ToastContext.tsx';
import type { CrossplaneData } from '../../types/Crossplane.ts';
import type { EsoData } from '../../types/Eso.ts';
import type { FluxData } from '../../types/Flux.ts';
import type { LandscaperData } from '../../types/Landscaper.ts';
import { ComponentsDashboardV2, ComponentsDashboardV2Props } from './ComponentsDashboardV2.tsx';

describe('ComponentsDashboardV2', () => {
  const crossplaneInstalled: CrossplaneData = { isInstalled: true, version: '1.2.3', providers: [] };
  const fluxInstalled: FluxData = { isInstalled: true, version: '2.0.0' };
  const landscaperInstalled: LandscaperData = { isInstalled: true, version: '3.0.0' };
  const esoInstalled: EsoData = { isInstalled: true, version: '4.0.0' };

  const mount = (props?: Partial<ComponentsDashboardV2Props>) => {
    cy.mount(
      <MockedProvider mocks={[]}>
        <ToastProvider>
          <ComponentsDashboardV2
            crossplaneData={null}
            landscaperData={null}
            fluxData={null}
            esoData={null}
            mcpName="my-mcp"
            mcpNamespace="project-foo--ws-bar"
            onNavigateToMcpSection={() => {}}
            {...props}
          />
        </ToastProvider>
      </MockedProvider>,
      {},
    );
  };

  it('renders all four component cards with names, descriptions, and versions', () => {
    mount({
      crossplaneData: crossplaneInstalled,
      fluxData: fluxInstalled,
      landscaperData: landscaperInstalled,
      esoData: esoInstalled,
    });

    cy.get('.ui5-card-header').should('have.length', 4);
    cy.get('.ui5-card-header').eq(0).should('contain.text', 'Crossplane').and('contain.text', 'v1.2.3');
    cy.get('.ui5-card-header').eq(1).should('contain.text', 'Flux').and('contain.text', 'v2.0.0');
    cy.get('.ui5-card-header').eq(2).should('contain.text', 'Landscaper').and('contain.text', 'v3.0.0');
    cy.get('.ui5-card-header').eq(3).should('contain.text', 'External Secrets Operator').and('contain.text', 'v4.0.0');
  });

  it('does not render the yamlViewButton slot before the status query has resolved a resource', () => {
    mount({ crossplaneData: crossplaneInstalled });

    // MockedProvider has no mocks configured, so the status query never resolves a resource -
    // the YAML button must stay hidden rather than falling back to a second, duplicate fetch.
    cy.get('[data-cy="yaml-view-button"]').should('not.exist');
  });

  it('opens the Crossplane install dialog from the Install button', () => {
    mount();

    cy.contains('ui5-card', 'Crossplane').within(() => {
      cy.get('[data-cy="install-button"]').click();
    });

    cy.contains('Install Crossplane').should('be.visible');
  });

  it('opens the Flux install dialog from the Install button', () => {
    mount();

    cy.contains('ui5-card', 'Flux').within(() => {
      cy.get('[data-cy="install-button"]').click();
    });

    cy.contains('Install Flux').should('be.visible');
  });

  it('opens the Landscaper edit dialog from the actions menu when installed', () => {
    mount({ landscaperData: landscaperInstalled });

    cy.contains('ui5-card', 'Landscaper').within(() => {
      cy.get('[data-cy="actions-menu-button"]').click();
    });
    cy.get('[data-cy="edit-menu-item"]').click();

    cy.contains('Edit Landscaper').should('be.visible');
  });

  it('opens the delete confirmation dialog for External Secrets Operator from the actions menu', () => {
    mount({ esoData: esoInstalled });

    cy.contains('ui5-card', 'External Secrets Operator').within(() => {
      cy.get('[data-cy="actions-menu-button"]').click();
    });
    cy.get('[data-cy="delete-menu-item"]').click();

    cy.contains('Delete External Secrets Operator').should('be.visible');
  });
});
