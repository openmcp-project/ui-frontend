#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

CONTEXT="kind-headlamp-dev"
NAMESPACE="headlamp"

POD=$(kubectl --context "$CONTEXT" get pod -n "$NAMESPACE" -l app.kubernetes.io/name=headlamp -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [[ -z "$POD" ]]; then
  echo "error: no headlamp pod found in namespace '${NAMESPACE}' (context: ${CONTEXT})" >&2
  echo "  Run: task headlamp:setup" >&2
  exit 1
fi

echo "→ building opencontrolplane plugin..."
(cd "${ROOT_DIR}/../opencontrolplane-headlamp-plugin" && npm run build 2>&1 | tail -3)

echo "→ syncing to pod ${POD}:/headlamp/plugins/opencontrolplane-plugin/main.js ..."
kubectl --context "$CONTEXT" cp "${ROOT_DIR}/../opencontrolplane-headlamp-plugin/dist/main.js" "${NAMESPACE}/${POD}:/headlamp/plugins/opencontrolplane-plugin/main.js"
echo "✓ opencontrolplane plugin deployed"

echo ""
echo "✓ Plugin synced. Hard-refresh the browser to pick up changes."
