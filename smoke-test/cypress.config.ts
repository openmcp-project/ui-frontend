import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Base URL injected at runtime via CYPRESS_BASE_URL env var
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    screenshotsFolder: 'results/screenshots',
    videosFolder: 'results/videos',
    video: true,
    screenshotOnRunFailure: true,
    // Write results as JSON for post-processing into CRD
    reporter: 'json',
    reporterOptions: {
      output: 'results/report.json',
    },
    viewportWidth: 1920,
    viewportHeight: 1080,
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    // Certificate auth: pass client cert path via env
    clientCertificates: process.env.CYPRESS_CLIENT_CERT_PATH
      ? [
          {
            url: process.env.CYPRESS_BASE_URL ?? 'http://localhost:5173',
            certs: [
              {
                cert: process.env.CYPRESS_CLIENT_CERT_PATH,
                key: process.env.CYPRESS_CLIENT_KEY_PATH ?? '',
              },
            ],
          },
        ]
      : [],
    env: {
      // Credentials — passed via env, never hardcoded
      USERNAME: process.env.SMOKE_USERNAME ?? '',
      PASSWORD: process.env.SMOKE_PASSWORD ?? '',
      // Resource names to create
      PROJECT_NAME: process.env.SMOKE_PROJECT_NAME ?? 'smoke-test-project',
      WORKSPACE_NAME: process.env.SMOKE_WORKSPACE_NAME ?? 'smoke-test-ws',
      MCP_NAME: process.env.SMOKE_MCP_NAME ?? 'smoke-test-mcp',
      // Set to "true" to skip pre-test cleanup
      SKIP_CLEANUP: process.env.SMOKE_SKIP_CLEANUP ?? 'false',
      // Optional: comma-separated emails to add as admins on all created resources
      // Useful for ops/debugging access after the smoke test completes
      EXTRA_ADMINS: process.env.SMOKE_EXTRA_ADMINS ?? '',
    },
  },
});
