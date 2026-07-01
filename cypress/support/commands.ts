import '@ui5/webcomponents-cypress-commands';
import '../../src/utils/i18n/i18n';

// Sort object keys recursively so deep equality is key-order-insensitive
const toPlain = <T>(o: T): T => {
  const json = JSON.stringify(o, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
  return JSON.parse(json) as T;
};

Cypress.Commands.add('deepEqualJson', { prevSubject: true }, (subject, expected) => {
  expect(toPlain(subject)).to.deep.equal(toPlain(expected));
  return subject;
});

/**
 * Click an element only after asserting it is visible AND not `disabled`.
 *
 * The default `.click()` retries the query, but once it hits an element it
 * fires the click regardless of whether the element is disabled — that's what
 * produces the intermittent `cy.type() failed because it targeted a disabled
 * element` (and the click-noop equivalents). This helper gates on both
 * visibility and enablement before dispatching, which is what almost every
 * `.click({ force: true })` in this repo was papering over.
 *
 * Prefer this over `.click({ force: true })` — `force` bypasses the checks
 * that would otherwise catch a real bug (element under an overlay, dialog
 * animation still running, form still initialising, etc.).
 */
Cypress.Commands.add('clickEnabled', { prevSubject: 'element' }, (subject) => {
  return cy
    .wrap(subject)
    .should('be.visible')
    .should('not.have.attr', 'disabled')
    .click();
});

/**
 * Type into a UI5 input only after asserting it is visible AND not disabled.
 *
 * `typeIntoUi5Input` from `@ui5/webcomponents-cypress-commands` reaches into
 * the shadow DOM `<input>` and calls `.type()` — if the outer `<ui5-input>`
 * is disabled the inner input is disabled too, and Cypress fails hard with
 * `cy.type() failed because it targeted a disabled element`. Most of our
 * flakes are edit-dialog forms that render empty on mount and get populated
 * a tick later by `react-hook-form.reset()` inside a `useEffect`.
 *
 * Gate on `not.have.attr('disabled')` here so the assertion retries until
 * the form is ready.
 */
Cypress.Commands.add('typeIntoEnabledUi5Input', { prevSubject: 'element' }, (subject, text: string) => {
  return cy
    .wrap(subject)
    .should('be.visible')
    .should('not.have.attr', 'disabled')
    .typeIntoUi5Input(text);
});

/**
 * Wait for a `<ui5-dialog>` to finish opening before letting the caller
 * interact with its contents. UI5 dialogs animate in; a `.find('ui5-input')`
 * immediately after the trigger click can resolve before the input mounts.
 *
 * Use as the entry point for any dialog interaction:
 *
 *     cy.openedDialog().find('ui5-input').typeIntoEnabledUi5Input('foo');
 *
 * The selector defaults to `ui5-dialog[open]`; pass one when a page has
 * multiple dialogs and you need to disambiguate.
 */
Cypress.Commands.add('openedDialog', (selector: string = 'ui5-dialog[open]') => {
  return cy.get(selector).should('be.visible');
});
