// The Matomo bootstrap is injected at server startup (injectMatomoTag) into
// dist/client/index.html, populating window._paq. This file only declares its shape.

interface Matomo {
  push(events: ['trackEvent', string, string, string?, number?]): void; // ['trackEvent', category, action, name, value]
  push(events: ['setUserId', string]): void; // ['setUserId', userId]
  push(events: ['resetUserId']): void; // ['resetUserId']
}

declare global {
  interface Window {
    _paq?: Matomo;
  }
}

export type { Matomo };
