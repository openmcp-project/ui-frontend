#!/bin/bash
# Script to start dev server with specific analytics provider
# Usage: ./scripts/dev-with-analytics.sh [provider]
# provider: dynatrace, plausible, or noop (default: noop)

PROVIDER=${1:-noop}
CONFIG_FILE="frontend-config.json"
PUBLIC_CONFIG_FILE="public/frontend-config.json"
BACKUP_FILE="frontend-config.json.backup"
PUBLIC_BACKUP_FILE="public/frontend-config.json.backup"

# Validate provider
if [[ ! "$PROVIDER" =~ ^(dynatrace|plausible|noop)$ ]]; then
  echo "Error: Invalid provider '$PROVIDER'"
  echo "Usage: $0 [dynatrace|plausible|noop]"
  exit 1
fi

# Backup original configs
if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$BACKUP_FILE"
  echo "📝 Backed up $CONFIG_FILE to $BACKUP_FILE"
fi

if [ -f "$PUBLIC_CONFIG_FILE" ]; then
  cp "$PUBLIC_CONFIG_FILE" "$PUBLIC_BACKUP_FILE"
  echo "📝 Backed up $PUBLIC_CONFIG_FILE to $PUBLIC_BACKUP_FILE"
fi

# Update analytics provider in root config
if command -v jq &> /dev/null; then
  # Use jq if available for cleaner JSON manipulation
  jq ".analytics.provider = \"$PROVIDER\" | .analytics.enabled = true | .analytics.debug = true" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
  mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

  # Update public config (merge analytics into existing config)
  jq ". + {analytics: {provider: \"$PROVIDER\", enabled: true, debug: true, autoTrack: {clicks: true, pageViews: true, errors: true}}}" "$PUBLIC_CONFIG_FILE" > "${PUBLIC_CONFIG_FILE}.tmp"
  mv "${PUBLIC_CONFIG_FILE}.tmp" "$PUBLIC_CONFIG_FILE"
else
  # Fallback to sed (less reliable but works without jq)
  sed -i.tmp "s/\"provider\": \"[^\"]*\"/\"provider\": \"$PROVIDER\"/" "$CONFIG_FILE"
  sed -i.tmp "s/\"enabled\": false/\"enabled\": true/" "$CONFIG_FILE"
  rm -f "${CONFIG_FILE}.tmp"

  echo "⚠️  jq not installed - cannot reliably update $PUBLIC_CONFIG_FILE"
  echo "Please install jq: brew install jq"
fi

echo "✅ Updated analytics provider to: $PROVIDER"
echo ""
echo "Root config:"
cat "$CONFIG_FILE"
echo ""
echo "Public config analytics:"
jq '.analytics' "$PUBLIC_CONFIG_FILE" 2>/dev/null || echo "(jq not available)"
echo ""

# Restore configs on script exit
trap "[ -f '$BACKUP_FILE' ] && mv '$BACKUP_FILE' '$CONFIG_FILE' && echo '🔄 Restored $CONFIG_FILE'; [ -f '$PUBLIC_BACKUP_FILE' ] && mv '$PUBLIC_BACKUP_FILE' '$PUBLIC_CONFIG_FILE' && echo '🔄 Restored $PUBLIC_CONFIG_FILE'" EXIT

# Start the dev server
echo "🚀 Starting dev server with $PROVIDER analytics..."
tsx ./server.ts --local-dev
