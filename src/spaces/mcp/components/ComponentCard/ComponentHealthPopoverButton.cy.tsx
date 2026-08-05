import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import { telemetry } from '../../../../lib/telemetry/telemetry.ts';
import { ComponentHealthPopoverButton, ComponentHealthPopoverButtonProps } from './ComponentHealthPopoverButton';

TimeAgo.addDefaultLocale(en);

describe('ComponentHealthPopoverButton', () => {
  const mount = (props: ComponentHealthPopoverButtonProps) => {
    cy.mount(<ComponentHealthPopoverButton {...props} />, {});
  };

  it('shows the Ready visual by default and toggles the conditions popover without bubbling the click', () => {
    const onCardClick = cy.stub().as('onCardClick');
    const props: ComponentHealthPopoverButtonProps = {
      componentName: 'Crossplane',
      phase: 'Ready',
      conditions: [
        { type: 'Ready', status: 'True', reason: 'Available', message: 'All good', lastTransitionTime: '2026-01-01' },
      ],
    };
    const wrapper = (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- test-only wrapper mirroring the real Card's onClick to assert click propagation
      <div onClick={onCardClick}>
        <ComponentHealthPopoverButton {...props} />
      </div>
    );

    cy.mount(wrapper, {});

    cy.contains('Ready').should('be.visible');
    cy.get('ui5-icon').should('have.attr', 'name', 'sap-icon://sys-enter-2');

    // Scoped to the toggle button specifically: once the popover is open, its content (e.g. the
    // condition's "Copy" toolbar button) also matches "ui5-button" within this same boundary.
    cy.get('[data-cy="component-health-button"] ui5-button').first().click();
    cy.get('@onCardClick').should('not.have.been.called');
    cy.contains('Available').should('be.visible');

    // Clicking content inside the open popover must not bubble to the Card's onClick either.
    // "Available" appears twice (the message header subtitle and the raw condition YAML dump
    // below it), so target the first match explicitly rather than relying on a single result.
    cy.contains('Available').first().click();
    cy.get('@onCardClick').should('not.have.been.called');

    cy.get('[data-cy="component-health-button"] ui5-button').first().click();
    cy.contains('Available').should('not.exist');
  });

  it('fires component.status-viewed telemetry once per open, not on close', () => {
    cy.stub(telemetry(), 'track').as('track');
    mount({ componentName: 'Crossplane', phase: 'Ready', conditions: [] });

    cy.get('[data-cy="component-health-button"] ui5-button').click();
    cy.get('@track').should('have.been.calledOnceWith', {
      name: 'component.status-viewed',
      componentName: 'Crossplane',
    });

    cy.get('[data-cy="component-health-button"] ui5-button').click();
    cy.get('@track').should('have.been.calledOnce');
  });

  it('renders the warning visual for an unrecognized phase', () => {
    mount({ componentName: 'Crossplane', phase: 'SomeFuturePhase', conditions: [] });

    cy.contains('SomeFuturePhase').should('be.visible');
    cy.get('ui5-icon').should('have.attr', 'name', 'sap-icon://message-warning');
  });

  it('renders a pending visual instead of Ready while the status query is loading', () => {
    mount({ componentName: 'Crossplane', phase: null, conditions: [], isLoading: true });

    cy.contains('Ready').should('not.exist');
    cy.get('ui5-icon').should('have.attr', 'name', 'sap-icon://pending');
  });

  it('renders the warning visual instead of Ready when the status query errored', () => {
    mount({ componentName: 'Crossplane', phase: null, conditions: [], hasError: true });

    cy.contains('Ready').should('not.exist');
    cy.contains('Unknown').should('be.visible');
    cy.get('ui5-icon').should('have.attr', 'name', 'sap-icon://message-warning');
  });
});
