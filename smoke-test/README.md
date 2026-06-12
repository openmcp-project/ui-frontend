# openmcp UI Smoke Test

A portable, containerised end-to-end smoke test for any **openmcp-project UI** deployment.  
After each deployment your ops team can run a single container that logs in, creates a project → workspace → control plane, verifies the result, and writes a structured report.

---

## Quick start

### Local (direct Cypress)

```sh
cd smoke-test
npm install
cp env.smoke.template .env.smoke   # fill in CYPRESS_BASE_URL, credentials, etc.
set -a && source .env.smoke && set +a
npm run smoke          # headless
npm run smoke:open     # interactive browser
```

### Local (Docker)

```sh
cd smoke-test
cp env.smoke.template .env.smoke
docker compose run smoke
# Results written to smoke-test/results/
```

### CI / post-deployment pipeline

```sh
docker run --rm \
  -e CYPRESS_BASE_URL=https://my-ui.example.com \
  -e SMOKE_USERNAME=ops@example.com \
  -e SMOKE_PASSWORD=*** \
  -v "$(pwd)/results:/results" \
  ghcr.io/openmcp-project/mcp-ui-smoke-test:latest
```

---

## Configuration

All parameters are passed as environment variables.

| Variable | Required | Default | Description |
|---|---|---|---|
| `CYPRESS_BASE_URL` | ✅ | — | Base URL of the deployed UI |
| `SMOKE_USERNAME` | ✅ | — | OIDC login username / email |
| `SMOKE_PASSWORD` | ✅ | — | OIDC login password |
| `CYPRESS_CLIENT_CERT_PATH` | | — | Path to client TLS cert (inside container) |
| `CYPRESS_CLIENT_KEY_PATH` | | — | Path to client TLS key (inside container) |
| `SMOKE_PROJECT_NAME` | | `smoke-test-project` | Name of the project to create |
| `SMOKE_WORKSPACE_NAME` | | `smoke-test-ws` | Name of the workspace to create |
| `SMOKE_MCP_NAME` | | `smoke-test-mcp` | Name of the control plane to create |
| `SMOKE_SKIP_CLEANUP` | | `false` | Set `true` to skip pre-test deletion of existing resources |
| `SMOKE_EXTRA_ADMINS` | | — | Comma-separated emails to add as admins on project, workspace, and MCP — handy for ops debugging access after the run |
| `SMOKE_BROWSER` | | `chrome` | Browser to use (`chrome`, `electron`) |
| `KUBECONFIG` | | — | If set, applies the `SmokeTestResult` CRD to your cluster |

Mount `/certs` to pass a client certificate:

```sh
docker run --rm \
  -e CYPRESS_CLIENT_CERT_PATH=/certs/client.crt \
  -e CYPRESS_CLIENT_KEY_PATH=/certs/client.key \
  -v /path/to/my/certs:/certs:ro \
  -v "$(pwd)/results:/results" \
  ...
```

---

## Results

After a run, `results/` contains:

| File | Description |
|---|---|
| `report.json` | Raw Cypress JSON reporter output |
| `smoke-result.json` | Structured summary (overall pass/fail, per-test details) |
| `smoke-result.crd.yaml` | Kubernetes `SmokeTestResult` manifest ready to `kubectl apply` |
| `screenshots/` | Screenshots of failures (if any) |
| `videos/` | Full run video |

### `smoke-result.json` schema

```json
{
  "overall": "success | failure",
  "startTime": "2026-06-12T10:00:00.000Z",
  "durationMs": 45000,
  "totals": { "passed": 5, "failed": 0, "pending": 0, "total": 5 },
  "tests": [
    { "name": "Smoke test — signs in successfully", "state": "passed", "durationMs": 3200 }
  ]
}
```

### Kubernetes integration

Apply the CRD definition once:

```sh
kubectl apply -f smoke-test/smoke-test-crd.yaml
```

Then pass `KUBECONFIG` to the container — it will `kubectl apply` the result after each run.  
A Kubernetes operator or Argo CD `PostSync` hook can watch `SmokeTestResult` resources to automate rollbacks or alerts:

```sh
kubectl get smoketestresults   # shortname: str
kubectl get str -o wide
```

---

## Test flow

```
1. Cleanup (optional)     delete existing smoke project if present
2. Sign in                OIDC login via browser
3. Create project         name = SMOKE_PROJECT_NAME
4. Create workspace       name = SMOKE_WORKSPACE_NAME
5. Create control plane   name = SMOKE_MCP_NAME
6. Verify control plane   waits up to 2 min for MCP to appear
```

---

## Publishing a new version

The container is published to `ghcr.io/openmcp-project/mcp-ui-smoke-test`.

Tag the repo with `smoke-test/vX.Y.Z` to trigger the publish workflow, or run it manually from the GitHub Actions UI.

---

## Reusing existing component tests

The `*.cy.tsx` files in `src/` are **component tests** — they mount individual React components in isolation and do not require a running server.  
This smoke test is an **e2e test** — it drives a real browser against a live URL.  
The two test types share Cypress as the runner but use separate configs (`cypress.config.ts` at the root vs `smoke-test/cypress.config.ts`).
