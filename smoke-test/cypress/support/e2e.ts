// Smoke test support file — e2e mode
// Loaded before every spec automatically by Cypress

// Prevent Cypress from failing on uncaught exceptions from the app
// (e.g. OIDC redirect noise on load)
Cypress.on('uncaught:exception', () => false);
