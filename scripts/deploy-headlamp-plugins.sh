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

deploy_plugin() {
  local name="$1"
  local dir="$2"
  local plugin_dir="/headlamp/plugins/${name}-plugin"

  echo "→ building ${name} plugin..."
  (cd "$dir" && npm run build 2>&1 | tail -3)

  echo "→ syncing to pod ${POD}:${plugin_dir}/main.js ..."
  kubectl --context "$CONTEXT" cp "${dir}/dist/main.js" "${NAMESPACE}/${POD}:${plugin_dir}/main.js"
  echo "✓ ${name} plugin deployed"
}

deploy_plugin "crossplane"       "${ROOT_DIR}/../crossplane-headlamp-plugin"
deploy_plugin "opencontrolplane" "${ROOT_DIR}/../opencontrolplane-headlamp-plugin"

echo ""
echo "✓ All plugins synced. Hard-refresh the browser to pick up changes."
