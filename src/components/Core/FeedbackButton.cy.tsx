import '@ui5/webcomponents-cypress-commands';
import { FeedbackButton } from './FeedbackButton';
import { AnalyticsProvider } from '../../lib/analytics';
import { ToastProvider } from '../../context/ToastContext';

const analyticsConfig = {
  provider: 'noop' as const,
  enabled: true,
  debug: true,
  autoTrack: { clicks: true, pageViews: true, errors: true },
};

describe('FeedbackButton Analytics', () => {
  beforeEach(() => {
    // Stub fetch to prevent actual API calls
    cy.stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });

  it('tracks feedback button clicked event', () => {
    cy.mount(
      <AnalyticsProvider config={analyticsConfig}>
        <ToastProvider>
          <FeedbackButton />
        </ToastProvider>
      </AnalyticsProvider>,
    );

    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    // Click feedback button
    cy.get('ui5-button[icon="feedback"]').click();

    // Verify analytics event was tracked
    cy.get('@consoleLog').should('be.calledWith', '[NoopAdapter] trackEvent:', 'Feedback Button Clicked', {});
  });

  it('tracks feedback submitted event', () => {
    cy.mount(
      <AnalyticsProvider config={analyticsConfig}>
        <ToastProvider>
          <FeedbackButton />
        </ToastProvider>
      </AnalyticsProvider>,
    );

    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    // Open feedback popover
    cy.get('ui5-button[icon="feedback"]').click();

    // Set rating
    cy.get('ui5-rating-indicator').click();

    // Enter feedback message
    cy.get('ui5-textarea').typeIntoUi5Input('This is test feedback');

    // Submit feedback
    cy.get('ui5-button').contains('Send Feedback').click();

    // Verify analytics event was tracked
    cy.get('@consoleLog').should(
      'be.calledWith',
      '[NoopAdapter] trackEvent:',
      'Feedback Submitted',
      Cypress.sinon.match({
        hasMessage: true,
      }),
    );

    // Verify success event was tracked
    cy.get('@consoleLog').should(
      'be.calledWith',
      '[NoopAdapter] trackEvent:',
      'Feedback Submission Successful',
      Cypress.sinon.match.any,
    );
  });

  it('tracks feedback submission failed event on error', () => {
    // Override fetch to return error
    cy.stub(window, 'fetch').rejects(new Error('Network error'));

    cy.mount(
      <AnalyticsProvider config={analyticsConfig}>
        <ToastProvider>
          <FeedbackButton />
        </ToastProvider>
      </AnalyticsProvider>,
    );

    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    // Open feedback popover
    cy.get('ui5-button[icon="feedback"]').click();

    // Set rating
    cy.get('ui5-rating-indicator').click();

    // Enter feedback message
    cy.get('ui5-textarea').typeIntoUi5Input('Test feedback');

    // Submit feedback
    cy.get('ui5-button').contains('Send Feedback').click();

    // Verify failure event was tracked
    cy.get('@consoleLog').should(
      'be.calledWith',
      '[NoopAdapter] trackEvent:',
      'Feedback Submission Failed',
      Cypress.sinon.match({
        error: 'Network error',
      }),
    );
  });
});
