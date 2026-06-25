#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="headlamp-dev"
NAMESPACE="headlamp"
CHART_VERSION="0.0.5"
PORT=8090

CLUSTER_CREATED=false

kill_port() {
  local port="$1"
  if command -v lsof &>/dev/null; then
    lsof -ti :"$port" | xargs kill -9 2>/dev/null || true
  elif command -v fuser &>/dev/null; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
}

cleanup() {
  echo ""
  echo "✗ Setup failed — cleaning up..."
  kill_port "$PORT"
  if $CLUSTER_CREATED; then
    echo "→ deleting kind cluster '${CLUSTER_NAME}'..."
    kind delete cluster --name "$CLUSTER_NAME" 2>/dev/null || true
  fi
}
trap cleanup ERR

# ── Prerequisites ─────────────────────────────────────────────────────────────
echo "── Checking prerequisites ───────────────────────────────────────────────────"

check_cmd() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" &>/dev/null; then
    echo "  ✗ '$cmd' not found — ${hint}" >&2
    return 1
  fi
  echo "  ✓ $cmd ($(command -v "$cmd"))"
}

MISSING=0
check_cmd kind    "install: https://kind.sigs.k8s.io/docs/user/quick-start/#installation"    || MISSING=1
check_cmd kubectl "install: https://kubernetes.io/docs/tasks/tools/"                          || MISSING=1
check_cmd helm    "install: https://helm.sh/docs/intro/install/"                              || MISSING=1
check_cmd curl    "install via your package manager (brew install curl / apt install curl)"   || MISSING=1
check_cmd docker  "install: https://docs.docker.com/get-docker/ (needed by kind)"            || MISSING=1

if [[ $MISSING -ne 0 ]]; then
  echo ""
  echo "error: one or more required tools are missing — install them and re-run." >&2
  exit 1
fi

echo ""

# ── Kind cluster ──────────────────────────────────────────────────────────────
echo "── Cluster ──────────────────────────────────────────────────────────────────"

if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  echo "✓ kind cluster '${CLUSTER_NAME}' already exists"
else
  echo "→ creating kind cluster '${CLUSTER_NAME}'..."
  kind create cluster --name "$CLUSTER_NAME"
  CLUSTER_CREATED=true
fi

kubectl config use-context "kind-${CLUSTER_NAME}"

if [[ -f /.dockerenv ]]; then
  echo "→ DooD: joining kind network and patching kubeconfig..."
  docker network connect kind "$(hostname)" 2>/dev/null || true
  CP_IP=$(docker inspect "${CLUSTER_NAME}-control-plane" \
    --format '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' 2>/dev/null \
    | awk '{print $NF}' | tr -d ' \n' || true)
  [[ -n "$CP_IP" ]] && sed -i "s|server: https://[^'\"]*|server: https://${CP_IP}:6443|g" "$HOME/.kube/config" \
    || echo "  warning: could not determine control-plane IP — kubectl may fail" >&2
fi

echo ""

# ── Headlamp via OCI Helm chart ───────────────────────────────────────────────
echo "── Deploying headlamp-deployment ${CHART_VERSION} via OCI Helm chart ──────────"
helm upgrade --install headlamp \
  oci://ghcr.io/openmcp-project/helm-charts/headlamp-deployment \
  --version "$CHART_VERSION" \
  --namespace "$NAMESPACE" --create-namespace \
  --wait --timeout 300s

echo ""

# ── Port-forward ──────────────────────────────────────────────────────────────
echo "── Port-forward ─────────────────────────────────────────────────────────────"
if command -v lsof &>/dev/null && lsof -ti :"$PORT" &>/dev/null; then
  echo "→ stopping existing process on port ${PORT}..."
  kill_port "$PORT"
elif command -v fuser &>/dev/null && fuser "${PORT}/tcp" &>/dev/null 2>&1; then
  echo "→ stopping existing process on port ${PORT}..."
  kill_port "$PORT"
fi

echo "→ starting port-forward on http://localhost:${PORT}..."
kubectl port-forward svc/headlamp "$PORT":80 -n "$NAMESPACE" &>/tmp/headlamp-portforward.log &
PF_PID=$!

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
