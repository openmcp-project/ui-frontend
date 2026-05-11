# Analytics Abstraction Layer

Vendor-agnostic analytics implementation for tracking user behavior and interactions.

> 📘 **Local Testing**: Use the built-in debug panel (bottom-right corner) to see all analytics events in real-time when `debug: true` is enabled.

## Overview

This analytics system provides a unified API for tracking user events, page views, and multi-step workflows across different analytics providers (Dynatrace, etc.).

**Key Features:**
- ✅ Vendor-agnostic - easy to switch or support multiple providers
- ✅ TypeScript first - full type safety
- ✅ React hooks - simple `useAnalytics()` API
- ✅ Automatic tracking - page views, errors (optional)
- ✅ Lazy loading - only loads configured provider
- ✅ Zero user identification - privacy-focused
- ✅ Development-friendly - Noop adapter with console logging

## Architecture

```
src/lib/analytics/
├── core/
│   ├── types.ts                # TypeScript interfaces & types
│   ├── AnalyticsProvider.tsx   # React context provider
│   └── useAnalytics.ts         # React hooks
├── adapters/
│   ├── DynatraceAdapter.ts     # Dynatrace RUM implementation
│   └── NoopAdapter.ts          # Development/testing adapter
├── debug/
│   ├── AnalyticsDebugPanel.tsx # Real-time event viewer
│   └── AnalyticsDebugPanel.module.css
└── utils/
    ├── autoTracking.ts         # Auto page view tracking
    └── trackingHelpers.ts      # Helper functions & decorators
```

## Configuration

### frontend-config.json

```json
{
  "analytics": {
    "provider": "dynatrace",  // "dynatrace" | "noop"
    "enabled": true,
    "debug": false,
    "autoTrack": {
      "clicks": true,      // Auto-track data-track-* attributes
      "pageViews": true,   // Auto-track route changes
      "errors": true       // Auto-track errors
    }
  }
}
```

### Environment Variables

For Dynatrace, ensure the server injects the RUM script:

```env
DYNATRACE_SCRIPT_URL=https://your-dynatrace-instance.com/ruxitagentjs_...
```

## Usage

### Basic Event Tracking

```tsx
import { useAnalytics } from '@/lib/analytics';

function CreateButton() {
  const analytics = useAnalytics();

  const handleCreate = async () => {
    try {
      await createMCP(data);
      
      // Track successful creation
      analytics.trackEvent('MCP Created', {
        template: 'flux',
        workspace: workspaceName,
        components: 3
      });
    } catch (error) {
      analytics.trackError(error, {
        action: 'create_mcp',
        workspace: workspaceName
      });
    }
  };

  return <Button onClick={handleCreate}>Create</Button>;
}
```

### Multi-Step Workflows

Track complex user journeys like wizards:

```tsx
function CreateMCPWizard() {
  const analytics = useAnalytics();

  const handleStart = () => {
    const actionId = analytics.startAction('Create MCP Wizard', 'wizard');
    
    // Add context as user progresses
    analytics.addProperties({
      project: projectName,
      workspace: workspaceName
    });

    // Later, when wizard completes or closes
    analytics.endAction(actionId);
  };
}
```

### Declarative Tracking with Attributes

```tsx
import { fullTrackingProps } from '@/lib/analytics';

<Button 
  {...fullTrackingProps('Delete Workspace', {
    category: 'Workspaces',
    label: workspaceName
  })}
  onClick={handleDelete}
>
  Delete
</Button>
```

This adds both:
- `data-track-event="Delete Workspace"` (custom events)
- `data-dtname="Delete Workspace"` (Dynatrace automatic tracking)

### Page View Tracking

Automatic page view tracking is already set up in `AppRouter.tsx`:

```tsx
import { useAutoPageTracking } from '@/lib/analytics';

function AppRouter() {
  useAutoPageTracking(); // Tracks all route changes
  // ...
}
```

## API Reference

### `useAnalytics()`

Main hook for accessing analytics in components.

```tsx
const analytics = useAnalytics();

// Track discrete events
analytics.trackEvent(name: string, properties?: Record<string, any>);

// Track page views
analytics.trackPageView(name: string, properties?: Record<string, any>);

// Track multi-step actions
const id = analytics.startAction(name: string, type?: string);
analytics.endAction(id);

// Add context to current action
analytics.addProperties(properties: Record<string, any>);

// Track errors
analytics.trackError(error: Error, context?: Record<string, any>);

// Check readiness
analytics.isReady(): boolean;
```

### Tracking Helpers

```tsx
import {
  trackingProps,      // data-track-* attributes
  dtNameProp,         // data-dtname attribute
  fullTrackingProps   // Both combined
} from '@/lib/analytics';
```

## Supported Providers

### Dynatrace (Implemented)

Wraps `window.dtrum` JavaScript API:
- `trackEvent` → `reportCustomEvent`
- `startAction`/`endAction` → `enterAction`/`leaveAction`
- `addProperties` → `addActionProperties`
- `trackError` → `reportError`

**Configuration:**
```json
{
  "provider": "dynatrace",
  "enabled": true
}
```

### Noop (Development/Testing)

Logs to console in development mode, no actual tracking:
```json
{
  "provider": "noop",
  "enabled": false,
  "debug": true  // Console logging in dev
}
```

### Future Providers

- **Google Analytics 4**: GA4 events API
- **Custom**: Easy to implement `AnalyticsAdapter` interface

## Adding a New Provider

1. Create adapter implementing `AnalyticsAdapter` interface:

```typescript
// src/lib/analytics/adapters/MyProviderAdapter.ts
import type { AnalyticsAdapter, ActionId, AnalyticsProperties } from '../core/types';

export class MyProviderAdapter implements AnalyticsAdapter {
  async initialize(config?: Record<string, any>): Promise<void> {
    // Initialize your provider SDK
  }

  trackEvent(name: string, properties?: AnalyticsProperties): void {
    // Implement event tracking
  }

  // ... implement other methods
}
```

2. Add to provider switch in `AnalyticsProvider.tsx`:

```typescript
case 'my-provider': {
  const { MyProviderAdapter } = await import('../adapters/MyProviderAdapter');
  loadedAdapter = new MyProviderAdapter(config.debug);
  break;
}
```

3. Update TypeScript types in `types.ts`:

```typescript
provider: 'dynatrace' | 'my-provider' | 'noop';
```

## Best Practices

### Event Naming

- Use clear, human-readable names: `"MCP Created"` not `"mcp_create"`
- Use consistent tense: past tense for completed actions
- Be specific: `"Flux MCP Created"` vs `"MCP Created"`

### Properties

- Keep property keys lowercase with underscores: `workspace_name`
- Include relevant context: project, workspace, component names
- Don't include sensitive data (passwords, tokens, emails)
- Keep values simple: strings, numbers, booleans

### When to Track

**DO track:**
- User-initiated actions (clicks, form submits)
- Workflow completions (wizard finished, resource created)
- Feature usage (tab changes, menu selections)
- Errors and exceptions

**DON'T track:**
- Automated background processes
- Every mouse move or keystroke
- Personally identifiable information
- Internal system events

## Examples

### Track Button Clicks

```tsx
<Button
  {...fullTrackingProps('Connect to MCP')}
  onClick={handleConnect}
>
  Connect
</Button>
```

### Track Menu Item Selection

```tsx
<MenuItem
  {...fullTrackingProps('Delete Workspace', {
    category: 'Workspace Actions'
  })}
  onClick={handleDelete}
>
  Delete workspace
</MenuItem>
```

### Track Tab Changes

```tsx
const handleTabChange = (tabKey: string) => {
  analytics.trackEvent('Tab Changed', {
    from: currentTab,
    to: tabKey,
    page: 'Control Plane Detail'
  });
  setCurrentTab(tabKey);
};
```

### Track Form Submission

```tsx
const handleSubmit = async (data) => {
  const actionId = analytics.startAction('Create MCP Form Submit');
  
  try {
    const result = await createMCP(data);
    
    analytics.trackEvent('MCP Created', {
      template: data.template,
      components: data.components.length
    });
    
    analytics.endAction(actionId);
  } catch (error) {
    analytics.trackError(error);
    analytics.endAction(actionId);
  }
};
```

## Debugging

### Enable Debug Mode

Set `debug: true` in frontend-config.json to see console logs:

```json
{
  "analytics": {
    "provider": "dynatrace",
    "enabled": true,
    "debug": true
  }
}
```

Output:
```
[DynatraceAdapter] trackEvent: MCP Created { template: 'flux', workspace: 'dev' }
[DynatraceAdapter] startAction: Create MCP Wizard ID: 123
[DynatraceAdapter] endAction: Create MCP Wizard ID: 123
```

### Test with Noop Adapter

Use the noop adapter during development:

```json
{
  "analytics": {
    "provider": "noop",
    "enabled": false,
    "debug": true
  }
}
```

## Migration Guide

### From No Analytics

1. Add analytics config to `frontend-config.json`
2. Analytics is already integrated - no code changes needed!
3. Add tracking to specific interactions using `useAnalytics()` hook

### From Direct Dynatrace Usage

Before:
```tsx
window.dtrum?.reportCustomEvent('MCP Created', { template: 'flux' });
```

After:
```tsx
const analytics = useAnalytics();
analytics.trackEvent('MCP Created', { template: 'flux' });
```

## Privacy & Compliance

- ❌ **No user identification** - we deliberately exclude `identify()` method
- ✅ **No PII tracking** - don't send emails, names, or sensitive data
- ✅ **Configurable** - easy to disable or switch providers
- ✅ **Transparent** - all tracking is explicit in code

## Performance

- **Lazy loading**: Only configured provider is loaded (~5-20KB)
- **Async initialization**: Non-blocking, doesn't delay app startup
- **Batching**: Providers handle batching internally
- **Error handling**: Failed tracking doesn't break the app

## Troubleshooting

### Analytics not tracking

1. Check `frontend-config.json` has `enabled: true`
2. Verify provider is correctly initialized (check console)
3. For Dynatrace: ensure `DYNATRACE_SCRIPT_URL` is set and script loads
4. Enable `debug: true` to see console logs

### TypeScript errors

```bash
npm run type-check
```

Make sure `AnalyticsAdapter` interface is properly implemented.

### Provider not loading

Check browser console for errors. Fallback to NoopAdapter on failure.

## Contributing

To add a new analytics provider:

1. Implement `AnalyticsAdapter` in `/adapters`
2. Add provider to switch statement in `AnalyticsProvider.tsx`
3. Update types and this README
4. Add tests (see existing adapter tests)
5. Submit PR with documentation

## License

REUSE-compliant - see LICENSE files in source.
