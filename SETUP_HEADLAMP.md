# Headlamp + UI Frontend Setup Guide

End-to-end walkthrough: spin up Headlamp in a local kind cluster, wire it to a downstream cluster, and run this UI alongside it.

---

## Prerequisites

- `kind`, `kubectl`, `helm` installed
- Access to a downstream MCP cluster (kubeconfig downloadable from the UI)
- Node.js (for the UI)

---

## 1. Create a local kind cluster

```bash
kind create cluster --name local-dev
kubectl config use-context kind-kind-local-dev
```

---

## 2. ServiceAccount on the downstream cluster

Headlamp proxies all Kubernetes API calls through a ServiceAccount on the downstream cluster. Create one with full cluster-admin rights.

```bash
# Point at your downstream cluster
export KUBECONFIG=/path/to/downstream-kubeconfig.yaml

kubectl create serviceaccount ekx -n default

kubectl create clusterrolebinding ekx-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=default:ekx
```

---

## 3. Kiosk plugin

The kiosk plugin hides Headlamp's nav/appbar and auto-redirects to `/flux/overview`. The source lives at [github.com/Lasserich/headlamp](https://github.com/Lasserich/headlamp).

Clone and build it:

```bash
git clone https://github.com/Lasserich/headlamp.git
cd headlamp/kiosk-mode
npm install
npx @kinvolk/headlamp-plugin build
```

Create a ConfigMap from the build output (in the **local-dev** cluster):

```bash
kubectl config use-context kind-kind-local-dev

kubectl create configmap headlamp-kiosk-plugin \
  --from-file=main.js=./dist/main.js \
  --from-file=package.json=./package.json
```

The `package.json` must contain `"type": "commonjs"` and `"main": "main.js"` — Headlamp uses these to load the plugin.

---

## 4. Install Headlamp via Helm

Save the following as `headlamp-values.yaml`. It references the kiosk plugin ConfigMap you just created and pulls the Flux plugin from ArtifactHub automatically at pod start.

```yaml
config:
  extraArgs:
    - -in-cluster
    - -enable-dynamic-clusters
    - -user-plugins-dir=/headlamp/user-plugins
    - -watch-plugins-changes=true
  pluginsDir: /headlamp/plugins

# Remote plugins: downloaded by an init container when the pod starts
pluginsManager:
  enabled: true
  baseImage: node:lts-alpine
  configContent: |
    plugins:
      - name: flux
        source: https://artifacthub.io/packages/headlamp/headlamp-plugins/headlamp_flux

# Local plugin: kiosk mode mounted from the ConfigMap above
volumeMounts:
  - mountPath: /headlamp/user-plugins/headlamp-kiosk-plugin/main.js
    name: kiosk-plugin
    subPath: main.js
  - mountPath: /headlamp/user-plugins/headlamp-kiosk-plugin/package.json
    name: kiosk-plugin
    subPath: package.json

volumes:
  - name: kiosk-plugin
    configMap:
      name: headlamp-kiosk-plugin
```

Install:

```bash
helm repo add headlamp https://headlamp-k8s.github.io/headlamp/
helm repo update
helm install my-headlamp headlamp/headlamp -f headlamp-values.yaml
```

> `-in-cluster` wires Headlamp to the kind cluster's own API server as the `main` cluster.
> `-enable-dynamic-clusters` enables the `/cluster` API for registering external clusters at runtime.

Wait for the pod:

```bash
kubectl rollout status deployment/my-headlamp
```

Port-forward to reach Headlamp locally:

```bash
kubectl port-forward deployment/my-headlamp 8080:4466
```

Headlamp is now at `http://localhost:8080`.

---

## 5. Run the UI and connect it to Headlamp

### 5a. Configure environment variables

Add the following to your `.env`:

```bash
# Browser-facing URL for the iframe src
VITE_HEADLAMP_URL=http://localhost:8080

# Server-side URL used by the BFF proxy (avoids CORS — never exposed to the browser)
HEADLAMP_URL=http://localhost:8080

# Set to "true" only when UI and Headlamp share the same in-cluster SA (see section 8)
# VITE_HEADLAMP_INCLUSTER=true
```

### 5b. Start the UI

```bash
git clone https://github.com/openmcp-project/ui-frontend.git
cd ui-frontend
git checkout headi
npm install
npm run dev
```

### 5c. How the cluster wiring works

When you open an MCP's Flux tab in the UI, `HeadlampIframe` automatically wires Headlamp to the correct downstream cluster:

1. Reads the kubeconfig from `McpContext` (fetched from the MCP's access secret in the cluster).
2. Calls the MCP API proxy to generate a short-lived `ekx` SA token via the Kubernetes `TokenRequest` API (8h TTL).
3. Extracts the API server URL from the kubeconfig.
4. POSTs a minimal kubeconfig (server + SA token) to `/api/headlamp/cluster` — this goes via the BFF proxy to avoid CORS.
5. Once registered, the iframe loads `/c/<mcp-name>/flux/overview`.

The kubeconfig downloaded from the UI uses OIDC exec-auth (a `kubectl oidc-login` plugin call), which the Headlamp backend cannot run. That is why a separate SA token is generated and a simplified kubeconfig is constructed — the `ekx` SA token is the credential Headlamp actually uses.

---

## 6. Test Kustomizations with a GitRepository

For a working Flux example to drive Headlamp's Flux view, see [github.com/Lasserich/kustomize](https://github.com/Lasserich/kustomize). It contains a `base/` + `overlays/` structure.

To wire it up with Flux on the downstream cluster:

```bash
export KUBECONFIG=/path/to/downstream-kubeconfig.yaml

# Install Flux if not already present
flux install

# Register the GitRepository
flux create source git kustomize-demo \
  --url=https://github.com/Lasserich/kustomize \
  --branch=main \
  --interval=1m

# Create a Kustomization pointing at the base directory
flux create kustomization kustomize-demo \
  --source=kustomize-demo \
  --path=./kustomize/base \
  --prune=true \
  --interval=5m
```

Headlamp's Flux view will show the `GitRepository` and `Kustomization` objects once they reconcile.

---

## 7. Token expiry

| Token | Default TTL | Notes |
|-------|-------------|-------|
| `kubectl create token` | 1 hour | Pass `--duration=8h` to extend |
| `TokenRequest` via UI | 8 hours | Set by `TOKEN_EXPIRY_SECONDS` in `HeadlampIframe.tsx` |
| OIDC access token (BFF) | ~1 hour | Refreshed automatically via refresh token |

When the SA token expires Headlamp returns 401. Fix: reload the Flux tab — the UI generates a fresh token and re-registers. To refresh manually:

```bash
# Generate a new token on the downstream cluster
NEW_TOKEN=$(kubectl create token ekx -n default --duration=8h \
  --kubeconfig /path/to/downstream-kubeconfig.yaml)

SERVER=$(kubectl config view --minify --kubeconfig /path/to/downstream-kubeconfig.yaml \
  -o jsonpath='{.clusters[0].cluster.server}')

# Build a minimal kubeconfig and re-register
cat > /tmp/ekx-kubeconfig.yaml <<EOF
apiVersion: v1
kind: Config
clusters:
  - name: my-cluster
    cluster:
      insecure-skip-tls-verify: true
      server: ${SERVER}
contexts:
  - name: my-cluster
    context:
      cluster: my-cluster
      namespace: default
      user: ekx
current-context: my-cluster
users:
  - name: ekx
    user:
      token: "${NEW_TOKEN}"
EOF

KUBECONFIG_B64=$(base64 < /tmp/ekx-kubeconfig.yaml | tr -d '\n')
curl -sX POST http://localhost:8080/cluster \
  -H 'Content-Type: application/json' \
  -d "{\"kubeconfig\": \"${KUBECONFIG_B64}\"}"
```

---

## 8. Troubleshooting

**Headlamp shows the kind cluster instead of the downstream one**
- Verify `-enable-dynamic-clusters` is set: `kubectl get deployment my-headlamp -o jsonpath='{.spec.template.spec.containers[0].args}'`
- Check the registration POST in browser DevTools → Network, filter `/api/headlamp/cluster`.

**`x509: certificate signed by unknown authority`**
- The Headlamp pod doesn't trust the downstream CA. `insecure-skip-tls-verify: true` in the generated kubeconfig is the fix (already in `HeadlampIframe.tsx`).

**CORS error on the `/cluster` POST**
- Never call Headlamp directly from the browser. The UI uses the BFF proxy at `/api/headlamp/cluster`.
- Ensure `HEADLAMP_URL` is set in `.env` and the server has been restarted after adding it.

**Port-forward drops after pod restart**
```bash
kill $(lsof -ti:8080)
kubectl port-forward deployment/my-headlamp 8080:4466
```

**Flux resources not visible**
- Confirm SA permissions: `kubectl auth can-i list gitrepositories --as=system:serviceaccount:default:ekx --kubeconfig /path/to/downstream-kubeconfig.yaml`

---

## 9. In-cluster deployment (future)

When both the UI and Headlamp run in the same cluster and share a ServiceAccount:

1. Set `VITE_HEADLAMP_INCLUSTER=true` in the UI environment.
2. Headlamp auto-detects its in-cluster SA token — no cluster registration is needed.
3. The iframe loads `/c/main/flux/overview` (Headlamp always names the in-cluster cluster `main`).
4. The pod's SA must have `cluster-admin` (or equivalent Flux read permissions) on that cluster.
