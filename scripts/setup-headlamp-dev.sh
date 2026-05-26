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

# ── Namespace + plugin ConfigMaps first (pod needs them to mount) ─────────────
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

echo "→ applying plugin ConfigMaps..."
kubectl apply -f "${SCRIPT_DIR}/configmap-kiosk-plugin.yaml"
kubectl apply -f "${SCRIPT_DIR}/configmap-crossplane-plugin.yaml"
kubectl apply -f "${SCRIPT_DIR}/configmap-opencontrolplane-plugin.yaml"

# ── Headlamp via Helm ─────────────────────────────────────────────────────────
helm repo add headlamp https://kubernetes-sigs.github.io/headlamp/ --force-update &>/dev/null

echo "→ deploying Headlamp ${HEADLAMP_VERSION} with Flux + kiosk + crossplane + opencontrolplane plugins..."
helm upgrade --install headlamp headlamp/headlamp \
  --version "$HEADLAMP_VERSION" \
  --namespace "$NAMESPACE" \
  --values - \
  --wait --timeout 300s <<'EOF'
replicaCount: 1
config:
  baseURL: /api/headlamp
  pluginsDir: /headlamp/plugins
  watchPlugins: false
  extraArgs:
    - -enable-dynamic-clusters
    - -session-ttl=86400
    - -in-cluster-context-name=main
initContainers:
  - name: flux-plugin
    image: ghcr.io/headlamp-k8s/headlamp-plugin-flux:latest
    imagePullPolicy: Always
    command: [/bin/sh, -c, "cp -r /plugins/* /headlamp/plugins/"]
    volumeMounts:
      - name: headlamp-plugins
        mountPath: /headlamp/plugins
  - name: copy-plugins
    image: busybox
    command:
      - /bin/sh
      - -c
      - |
        for plugin in kiosk crossplane opencontrolplane; do
          mkdir -p /headlamp/plugins/${plugin}-plugin
          cp /configmaps/${plugin}/main.js /headlamp/plugins/${plugin}-plugin/main.js
          cp /configmaps/${plugin}/package.json /headlamp/plugins/${plugin}-plugin/package.json
          chmod -R a+w /headlamp/plugins/${plugin}-plugin
        done
    volumeMounts:
      - name: headlamp-plugins
        mountPath: /headlamp/plugins
      - name: kiosk-plugin-cm
        mountPath: /configmaps/kiosk
      - name: crossplane-plugin-cm
        mountPath: /configmaps/crossplane
      - name: opencontrolplane-plugin-cm
        mountPath: /configmaps/opencontrolplane
volumeMounts:
  - name: headlamp-plugins
    mountPath: /headlamp/plugins
volumes:
  - name: headlamp-plugins
    emptyDir: {}
  - name: kiosk-plugin-cm
    configMap:
      name: kiosk-plugin
  - name: crossplane-plugin-cm
    configMap:
      name: crossplane-plugin
  - name: opencontrolplane-plugin-cm
    configMap:
      name: opencontrolplane-plugin
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
