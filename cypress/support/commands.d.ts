declare global {
  namespace Cypress {
    interface Chainable<Subject = unknown> {
      /**
       * Deep-compares two objects after normalising them with
       * JSON.stringify/parse (removes proxies, undefined, symbols …).
       *
       * @example
       *   cy.wrap(actual).deepEqualJson(expected)
       */
      deepEqualJson(expected: unknown): Chainable<Subject>;

      /**
       * Click after asserting the element is visible AND not `[disabled]`.
       * Replaces `.click({ force: true })` — `force` masks real bugs
       * (overlay, still-animating dialog, form not yet initialised).
       *
       * @example
       *   cy.get('[data-testid="save"]').clickEnabled();
       */
      clickEnabled(): Chainable<Subject>;

      /**
       * Type into a `<ui5-input>` after asserting it is visible AND not
       * disabled. Prevents `cy.type() failed because it targeted a
       * disabled element` in edit-dialog forms that populate lazily via
       * `useEffect` + `react-hook-form.reset()`.
       *
       * @example
       *   cy.get('ui5-dialog[open] ui5-input').typeIntoEnabledUi5Input('foo');
       */
      typeIntoEnabledUi5Input(text: string): Chainable<Subject>;

      /**
       * Wait for a `<ui5-dialog>` to finish opening before interacting with
       * its contents. Defaults selector to `ui5-dialog[open]`.
       *
       * @example
       *   cy.openedDialog().find('ui5-input').typeIntoEnabledUi5Input('foo');
       */
      openedDialog(selector?: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

export {};
