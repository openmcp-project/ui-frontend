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
    }
  }
}

export {};
