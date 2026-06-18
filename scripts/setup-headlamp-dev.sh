#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CLUSTER_NAME="headlamp-dev"
NAMESPACE="headlamp"
HEADLAMP_VERSION="0.42.0"
PORT=8090

CLUSTER_CREATED=false

cleanup() {
  echo ""
  echo "✗ Setup failed — cleaning up..."
  lsof -ti :"$PORT" | xargs kill -9 2>/dev/null || true
  if $CLUSTER_CREATED; then
    echo "→ deleting kind cluster '${CLUSTER_NAME}'..."
    kind delete cluster --name "$CLUSTER_NAME" 2>/dev/null || true
  fi
}
trap cleanup ERR

# ── Prerequisites ────────────────────────────────────────────────────────────
for cmd in kind kubectl helm curl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "error: '$cmd' is required but not installed." >&2
    exit 1
  fi
done

# ── Kind cluster ─────────────────────────────────────────────────────────────
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  echo "✓ kind cluster '${CLUSTER_NAME}' already exists"
else
  echo "→ creating kind cluster '${CLUSTER_NAME}'..."
  kind create cluster --name "$CLUSTER_NAME"
  CLUSTER_CREATED=true
fi

kubectl config use-context "kind-${CLUSTER_NAME}"

# ── Namespace ─────────────────────────────────────────────────────────────────
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# ── Headlamp via Helm ─────────────────────────────────────────────────────────
helm repo add headlamp https://kubernetes-sigs.github.io/headlamp/ --force-update &>/dev/null

echo "→ deploying Headlamp ${HEADLAMP_VERSION} with flux + kiosk + crossplane (ArtifactHub)..."
helm upgrade --install headlamp headlamp/headlamp \
  --version "$HEADLAMP_VERSION" \
  --namespace "$NAMESPACE" \
  --values - \
  --wait --timeout 300s <<'EOF'
replicaCount: 1
config:
  baseURL: /api/headlamp
  pluginsDir: /headlamp/plugins
  extraArgs:
    - -enable-dynamic-clusters
    - -session-ttl=86400
    - -in-cluster-context-name=main
    - -user-plugins-dir=/headlamp/user-plugins
    - -watch-plugins-changes=true
pluginsManager:
  enabled: true
  baseImage: node:lts-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f
  configContent: |
    plugins:
      - name: headlamp-flux
        source: https://artifacthub.io/packages/headlamp/headlamp-plugins/headlamp_flux
      - name: headlamp-kiosk
        source: https://artifacthub.io/packages/headlamp/kiosk-headlamp-plugin/headlamp_kiosk
      - name: headlamp-crossplane
        source: https://artifacthub.io/packages/headlamp/crossplane-headlamp-plugin/headlamp_crossplane
EOF

# ── Port-forward ──────────────────────────────────────────────────────────────
if lsof -ti :"$PORT" &>/dev/null; then
  echo "→ stopping existing process on port ${PORT}..."
  lsof -ti :"$PORT" | xargs kill -9 2>/dev/null || true
fi

echo "→ starting port-forward on http://localhost:${PORT}..."
kubectl port-forward svc/headlamp "$PORT":80 -n "$NAMESPACE" &>/tmp/headlamp-portforward.log &
PF_PID=$!

# Wait until reachable
for i in $(seq 1 20); do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/api/headlamp/" | grep -q "200"; then
    break
  fi
  sleep 1
done

echo ""
echo "✓ Headlamp is running at http://localhost:${PORT}/api/headlamp/"
echo "  Port-forward PID: ${PF_PID} (logged to /tmp/headlamp-portforward.log)"
echo "  To stop: kill ${PF_PID}"
echo ""
echo "  Set HEADLAMP_UPSTREAM_URL=http://localhost:${PORT} in your .env, then: npm run dev"
