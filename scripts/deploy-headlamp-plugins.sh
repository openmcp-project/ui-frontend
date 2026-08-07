#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

CONTEXT="kind-headlamp-dev"
NAMESPACE="headlamp"

# @kinvolk/headlamp-plugin uses yargs which is incompatible with Node 26+.
# Use nvm to pin to Node 22 for both plugin builds.
BUILD_NODE_CMD="node"
if command -v nvm &>/dev/null || [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck source=/dev/null
  [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ] && source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  BUILD_NODE_CMD="nvm exec 22"
fi

POD=$(kubectl --context "$CONTEXT" get pod -n "$NAMESPACE" -l app.kubernetes.io/name=headlamp -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [[ -z "$POD" ]]; then
  echo "error: no headlamp pod found in namespace '${NAMESPACE}' (context: ${CONTEXT})" >&2
  echo "  Run: task headlamp:dev" >&2
  exit 1
fi

echo "→ building crossplane plugin..."
(cd "${ROOT_DIR}/../crossplane-headlamp-plugin" && $BUILD_NODE_CMD npm run build 2>&1 | tail -3)

echo "→ syncing to pod ${POD}:/headlamp/plugins/headlamp_crossplane/ ..."
kubectl --context "$CONTEXT" exec -n "$NAMESPACE" "$POD" -- mkdir -p /headlamp/plugins/headlamp_crossplane
kubectl --context "$CONTEXT" cp "${ROOT_DIR}/../crossplane-headlamp-plugin/dist/main.js" "${NAMESPACE}/${POD}:/headlamp/plugins/headlamp_crossplane/main.js"
kubectl --context "$CONTEXT" cp "${ROOT_DIR}/../crossplane-headlamp-plugin/package.json" "${NAMESPACE}/${POD}:/headlamp/plugins/headlamp_crossplane/package.json"
echo "✓ crossplane plugin deployed"

echo "→ building ocp plugin..."
(cd "${ROOT_DIR}/../opencontrolplane-headlamp-plugin" && $BUILD_NODE_CMD npm run build 2>&1 | tail -3)

echo "→ syncing to pod ${POD}:/headlamp/plugins/opencontrolplane/ ..."
kubectl --context "$CONTEXT" exec -n "$NAMESPACE" "$POD" -- mkdir -p /headlamp/plugins/opencontrolplane
kubectl --context "$CONTEXT" cp "${ROOT_DIR}/../opencontrolplane-headlamp-plugin/dist/main.js" "${NAMESPACE}/${POD}:/headlamp/plugins/opencontrolplane/main.js"
kubectl --context "$CONTEXT" cp "${ROOT_DIR}/../opencontrolplane-headlamp-plugin/package.json" "${NAMESPACE}/${POD}:/headlamp/plugins/opencontrolplane/package.json"
echo "✓ ocp plugin deployed"

echo ""
echo "✓ Plugins synced. Hard-refresh the browser to pick up changes."
