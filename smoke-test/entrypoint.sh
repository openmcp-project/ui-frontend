#!/bin/sh
# entrypoint.sh — runs inside the smoke test container.
# Exits 0 on success, 1 on test failure, 2 on bad configuration.

set -e

# ---- Required ---------------------------------------------------------------
if [ -z "$SMOKE_WEBAPP_URL" ]; then
  echo "ERROR: SMOKE_WEBAPP_URL is required (e.g. https://my-ui.example.com)"
  exit 2
fi

# ---- Optional with defaults -------------------------------------------------
: "${SMOKE_USERNAME:=""}"
: "${SMOKE_PASSWORD:=""}"
: "${SMOKE_PROJECT_NAME:="smoke-test-project"}"
: "${SMOKE_WORKSPACE_NAME:="smoke-test-ws"}"
: "${SMOKE_MCP_NAME:="smoke-test-mcp"}"
: "${SMOKE_SKIP_CLEANUP:="false"}"
: "${SMOKE_BROWSER:="chrome"}"

# ---- Push output directory -------------------------------------------------
mkdir -p /results

echo "==> Starting smoke test against $SMOKE_WEBAPP_URL"
echo "    Project : $SMOKE_PROJECT_NAME"
echo "    Workspace: $SMOKE_WORKSPACE_NAME"
echo "    MCP     : $SMOKE_MCP_NAME"
echo "    Cleanup : $SMOKE_SKIP_CLEANUP (skip=$SMOKE_SKIP_CLEANUP)"

# ---- Run Cypress -----------------------------------------------------------
set +e
npx cypress run \
  --config-file /smoke-test/cypress.config.ts \
  --browser "$SMOKE_BROWSER" \
  --headless \
  --reporter json \
  --reporter-options "output=/results/report.json"
CYPRESS_EXIT=$?
set -e

# ---- Convert report to JSON summary + CRD YAML ----------------------------
node /smoke-test/write-results.mjs --report /results/report.json || true

# ---- Print summary ---------------------------------------------------------
echo ""
echo "==> Smoke test complete"
if [ -f /results/smoke-result.json ]; then
  cat /results/smoke-result.json
fi

# ---- Apply CRD result to cluster if KUBECONFIG is provided ----------------
if [ -n "$KUBECONFIG" ] && [ -f /results/smoke-result.crd.yaml ]; then
  echo "==> Applying SmokeTestResult to cluster..."
  kubectl apply -f /results/smoke-result.crd.yaml || echo "WARN: kubectl apply failed (CRD may not be installed)"
fi

exit $CYPRESS_EXIT
