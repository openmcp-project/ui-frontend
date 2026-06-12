// Smoke test: end-to-end validation of a live openmcp-project UI deployment.
//
// Flow:
//   1. Cleanup (optional, skipped via SMOKE_SKIP_CLEANUP=true)
//   2. Sign in with OIDC / cert-based credentials
//   3. Create project
//   4. Create workspace inside the project
//   5. Create control plane inside the workspace
//   6. Wait for the control plane to appear as "Provisioning" or "Ready"
//
// All resource names and the base URL are injected via env vars — see
// cypress.config.ts for the full list.

const PROJECT = Cypress.env('PROJECT_NAME') as string;
const WORKSPACE = Cypress.env('WORKSPACE_NAME') as string;
const MCP = Cypress.env('MCP_NAME') as string;
const SKIP_CLEANUP = Cypress.env('SKIP_CLEANUP') === 'true';

// Comma-separated list of extra admin emails, e.g. "alice@example.com,bob@example.com"
const EXTRA_ADMINS: string[] = ((Cypress.env('EXTRA_ADMINS') as string) ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addExtraAdmins() {
  // Called while a wizard/dialog is open, on the Members step.
  // Adds each email from EXTRA_ADMINS as an admin member.
  if (EXTRA_ADMINS.length === 0) return;
  for (const email of EXTRA_ADMINS) {
    // Click the "Add member" / "+" button
    cy.get('ui5-button[icon="add"], ui5-button').contains('Add Member').click({ force: true });
    // Type the email in the new member row input
    cy.get('ui5-input[placeholder*="email"], ui5-input[placeholder*="user"]')
      .last()
      .find('input[id*="inner"]')
      .type(email);
  }
}

function deleteProjectIfExists(projectName: string) {
  // Navigate to the project list and delete the smoke project if it exists.
  // Silently succeeds if the project is not found.
  cy.visit('/#/mcp/projects');
  cy.get('body').then(($body) => {
    if ($body.text().includes(projectName)) {
      // Open the overflow menu on the matching row
      cy.contains(projectName)
        .closest('ui5-table-row, tr, [role="row"]')
        .find('ui5-button[icon="overflow"]')
        .click();
      cy.contains('Delete project').click({ force: true });
      cy.get('ui5-dialog[open]').find('ui5-input').type(projectName);
      cy.get('ui5-dialog[open]').find('ui5-button').contains('Delete').click();
      // Wait for deletion to complete (row disappears)
      cy.contains(projectName, { timeout: 60000 }).should('not.exist');
    }
  });
}

function signIn() {
  cy.visit('/');
  // Click the app's "Sign In" button — uses the system (default) IdP configured
  // in the deployment. Credentials are passed via OIDC session/cert; username
  // and password fields are only used if the IdP presents a login form.
  cy.get('ui5-button').contains('Sign In', { timeout: 15000 }).click();

  // If the IdP presents a username/password form, fill it in.
  // This is skipped when cert-based auth or SSO handles authentication silently.
  const username = Cypress.env('USERNAME') as string;
  const password = Cypress.env('PASSWORD') as string;
  if (username && password) {
    cy.get('input[name="username"], input[type="email"], #username', { timeout: 10000 })
      .then(($el) => {
        if ($el.length) {
          cy.wrap($el).type(username);
          cy.get('input[name="password"], input[type="password"], #password').type(password, { log: false });
          cy.get('button[type="submit"], input[type="submit"]').click();
        }
      });
  }

  // Wait to land back on the project list after the OIDC redirect
  cy.url({ timeout: 60000 }).should('include', '/mcp/projects');
  // Dismiss the Beta info popover if it appears on first load
  cy.get('body').then(($body) => {
    if ($body.find('ui5-popover[open]').length) {
      cy.get('ui5-popover[open] ui5-button').first().click({ force: true });
    }
  });
}

function createProject() {
  cy.visit('/#/mcp/projects');
  // Open create project dialog
  cy.get('ui5-button').contains('Create Project', { timeout: 10000 }).click();

  cy.get('ui5-dialog[open]', { timeout: 10000 }).within(() => {
    cy.get('#name').find('input[id*="inner"]').type(PROJECT);
    cy.get('#displayName').find('input[id*="inner"]').type(`Smoke Test Project`);
    cy.get('ui5-button').contains('Next').click();
    // Members step — add extra admins if requested
    addExtraAdmins();
    cy.get('ui5-button').contains('Create').click();
  });

  // Confirm project appears in the list
  cy.contains(PROJECT, { timeout: 30000 }).should('be.visible');
}

function createWorkspace() {
  cy.visit(`/#/mcp/projects/${PROJECT}`);
  cy.get('ui5-button').contains('Workspace', { timeout: 10000 }).click();

  cy.get('ui5-dialog[open]', { timeout: 10000 }).within(() => {
    cy.get('#name').find('input[id*="inner"]').type(WORKSPACE);
    cy.get('#displayName').find('input[id*="inner"]').type('Smoke Test Workspace');
    cy.get('ui5-button').contains('Next').click();
    // Members step
    addExtraAdmins();
    cy.get('ui5-button').contains('Create').click();
  });

  cy.contains(WORKSPACE, { timeout: 30000 }).should('be.visible');
}

function createControlPlane() {
  cy.visit(`/#/mcp/projects/${PROJECT}`);
  // Find the workspace tile and click "Create new Control Plane"
  cy.contains(WORKSPACE, { timeout: 15000 })
    .closest('ui5-card, [data-workspace]')
    .find('ui5-button')
    .contains('Create new Control Plane')
    .click({ force: true });

  cy.get('ui5-dialog[open], ui5-wizard', { timeout: 10000 }).within(() => {
    cy.get('input[id*="name"], #name').find('input[id*="inner"]').first().type(MCP);
    // Accept defaults for all other wizard steps
    cy.get('ui5-button').contains('Next').click();
    // Members step (if present in wizard)
    addExtraAdmins();
    cy.get('ui5-button').contains('Next').click();
    cy.get('ui5-button').contains('Create').click();
  });
}

function waitForControlPlane() {
  // Navigate to the workspace view and confirm the MCP card appears
  cy.visit(`/#/mcp/projects/${PROJECT}`);
  cy.contains(MCP, { timeout: 120000 }).should('be.visible');
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Smoke test — openmcp-project UI', () => {
  before(() => {
    if (!SKIP_CLEANUP) {
      signIn();
      deleteProjectIfExists(PROJECT);
    }
  });

  it('signs in successfully', () => {
    signIn();
    cy.url().should('include', '/mcp/projects');
  });

  it('creates a project', () => {
    createProject();
  });

  it('creates a workspace inside the project', () => {
    createWorkspace();
  });

  it('creates a control plane inside the workspace', () => {
    createControlPlane();
  });

  it('control plane appears in the workspace view', () => {
    waitForControlPlane();
  });
});
