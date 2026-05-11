#!/bin/bash
# Script to start dev server with specific analytics provider
# Usage: ./scripts/dev-with-analytics.sh [provider]
# provider: dynatrace, plausible, or noop (default: noop)

PROVIDER=${1:-noop}
CONFIG_FILE="frontend-config.json"
BACKUP_FILE="frontend-config.json.backup"

# Validate provider
if [[ ! "$PROVIDER" =~ ^(dynatrace|plausible|noop)$ ]]; then
  echo "Error: Invalid provider '$PROVIDER'"
  echo "Usage: $0 [dynatrace|plausible|noop]"
  exit 1
fi

# Backup original config
if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$BACKUP_FILE"
  echo "📝 Backed up $CONFIG_FILE to $BACKUP_FILE"
fi

# Update analytics provider in config
if command -v jq &> /dev/null; then
  # Use jq if available for cleaner JSON manipulation
  jq ".analytics.provider = \"$PROVIDER\" | .analytics.enabled = true | .analytics.debug = true" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
  mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
else
  # Fallback to sed (less reliable but works without jq)
  sed -i.tmp "s/\"provider\": \"[^\"]*\"/\"provider\": \"$PROVIDER\"/" "$CONFIG_FILE"
  sed -i.tmp "s/\"enabled\": false/\"enabled\": true/" "$CONFIG_FILE"
  rm -f "${CONFIG_FILE}.tmp"
fi

echo "✅ Updated $CONFIG_FILE with analytics provider: $PROVIDER"
echo ""
cat "$CONFIG_FILE"
echo ""

# Restore config on script exit
trap "[ -f '$BACKUP_FILE' ] && mv '$BACKUP_FILE' '$CONFIG_FILE' && echo '🔄 Restored original $CONFIG_FILE'" EXIT

# Start the dev server
echo "🚀 Starting dev server with $PROVIDER analytics..."
tsx ./server.ts --local-dev
