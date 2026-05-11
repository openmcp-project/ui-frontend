# Adding New Analytics Providers

This guide shows how to add a new analytics provider to the abstraction layer.

## Quick Start

### 1. Create Adapter

Create `src/lib/analytics/adapters/YourProviderAdapter.ts`:

```typescript
import type { AnalyticsAdapter, AnalyticsProperties, ActionId } from '../core/types';

export class YourProviderAdapter implements AnalyticsAdapter {
  private ready = false;
  private debug: boolean;

  constructor(debug = false) {
    this.debug = debug;
  }

  async initialize(config?: Record<string, unknown>): Promise<void> {
    // Initialize your provider SDK
    // e.g., load script, configure client
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  trackEvent(name: string, properties?: AnalyticsProperties): void {
    if (!this.isReady()) return;
    // Send event to your provider
    // yourProviderSDK.track(name, properties);
  }

  trackPageView(name: string, properties?: AnalyticsProperties): void {
    if (!this.isReady()) return;
    // Track page view
  }

  startAction(name: string, type?: string): ActionId {
    // Return action ID for multi-step tracking
    return Math.random().toString();
  }

  endAction(actionId: ActionId): void {
    // Complete action tracking
  }

  addProperties(properties: AnalyticsProperties): void {
    // Add contextual properties
  }

  trackError(error: Error, context?: AnalyticsProperties): void {
    // Track errors
  }

  cleanup?(): void {
    this.ready = false;
  }
}
```

### 2. Register in Provider

Update `src/lib/analytics/core/AnalyticsProvider.tsx`:

```typescript
case 'yourprovider': {
  const { YourProviderAdapter } = await import('../adapters/YourProviderAdapter');
  loadedAdapter = new YourProviderAdapter(config.debug);
  break;
}
```

### 3. Update Types

Update `src/lib/analytics/core/types.ts`:

```typescript
export interface AnalyticsConfig {
  provider: 'dynatrace' | 'yourprovider' | 'noop';
  // ...
}
```

Update `src/context/FrontendConfigContext.tsx`:

```typescript
provider: z.enum(['dynatrace', 'yourprovider', 'noop']).default('noop'),
```

### 4. Test

```bash
# Update config to use your provider
npm run dev
```

## Implementation Tips

**Initialization**: Wait for SDK availability, handle timeouts
**Privacy**: Never track PII - only resource metadata (kind, apiVersion)
**Error Handling**: Gracefully handle SDK failures, log to console in debug mode
**Lazy Loading**: Import adapters dynamically to reduce bundle size

## Examples

See existing adapters for reference:
- `DynatraceAdapter.ts` - Full-featured RUM integration
- `NoopAdapter.ts` - Minimal implementation for testing

## Testing

Create `YourProviderAdapter.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { YourProviderAdapter } from './YourProviderAdapter';

describe('YourProviderAdapter', () => {
  let adapter: YourProviderAdapter;

  beforeEach(() => {
    adapter = new YourProviderAdapter(true);
  });

  it('should initialize', async () => {
    await adapter.initialize();
    expect(adapter.isReady()).toBe(true);
  });

  it('should track events', () => {
    adapter.trackEvent('Test Event', { foo: 'bar' });
    // Verify event was sent to your provider
  });
});
```

Run tests: `npm run test:vi`
