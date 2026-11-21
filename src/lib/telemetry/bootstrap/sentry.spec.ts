import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeSentry } from './sentry';

type SentryModule = typeof import('@sentry/react');
type InitOptions = Parameters<SentryModule['init']>[0];

const { initMock, browserTracingIntegrationMock } = vi.hoisted(() => ({
  initMock: vi.fn<(options: unknown) => void>(),
  browserTracingIntegrationMock: vi.fn(() => ({ name: 'BrowserTracing' })),
}));

vi.mock('@sentry/react', () => ({
  init: initMock,
  reactRouterV7BrowserTracingIntegration: browserTracingIntegrationMock,
}));

const fetchMock = vi.fn<typeof fetch>();
const validConfig = {
  FRONTEND_SENTRY_DSN: 'https://public@example.test/1',
  FRONTEND_SENTRY_ENVIRONMENT: 'test',
};

function mockConfig(config: unknown): void {
  fetchMock.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(config),
  } as unknown as Response);
}

async function getInitOptions(): Promise<InitOptions> {
  await initializeSentry();
  expect(initMock).toHaveBeenCalledOnce();
  return initMock.mock.calls[0]![0] as InitOptions;
}

describe('initializeSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    mockConfig(validConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('initializes Sentry with restrictive data collection', async () => {
    await expect(initializeSentry()).resolves.toEqual({ isSentryEnabled: true });

    expect(fetchMock).toHaveBeenCalledWith('/sentry');
    expect(initMock).toHaveBeenCalledOnce();
    expect(initMock.mock.calls[0]![0]).toMatchObject({
      dsn: validConfig.FRONTEND_SENTRY_DSN,
      environment: validConfig.FRONTEND_SENTRY_ENVIRONMENT,
      dataCollection: {
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: { deny: ['code', 'state', 'token', 'apiKey'] },
        graphQL: { document: false, variables: false },
        genAI: { inputs: false, outputs: false },
        databaseQueryData: false,
        queues: false,
        stackFrameVariables: false,
        frameContextLines: 0,
      },
    });
  });

  it('removes sensitive data from error event requests', async () => {
    const options = await getInitOptions();
    const event = {
      type: undefined,
      request: {
        url: 'https://app.example.test/callback?Code=secret-code&safe=kept&STATE=secret-state&ToKeN=secret-token&APIKEY=secret-key#done',
        query_string: 'Code=secret-code&safe=kept&STATE=secret-state&ToKeN=secret-token&APIKEY=secret-key',
        data: JSON.stringify({ password: 'secret' }),
      },
    };

    const result = await options.beforeSend!(event, {});

    expect(result).toBe(event);
    expect(event.request.url).toBe('https://app.example.test/callback?safe=kept#done');
    expect(event.request.query_string).toBe('safe=kept');
    expect(event.request).not.toHaveProperty('data');
  });

  it('clears header values that reach the event boundary', async () => {
    const options = await getInitOptions();
    const event = {
      type: undefined,
      request: { headers: { authorization: 'Bearer secret', 'content-type': 'application/json' } },
    };

    await options.beforeSend!(event, {});

    expect(event.request.headers).toEqual({ authorization: '', 'content-type': '' });
  });

  it('removes sensitive parameters from breadcrumb URLs', async () => {
    const options = await getInitOptions();
    const sensitiveQuery = 'Code=secret-code&STATE=secret-state&safe=kept&ToKeN=secret-token&APIKEY=secret-key';
    const breadcrumb = {
      category: 'navigation',
      data: {
        url: `https://app.example.test/#/current?${sensitiveQuery}`,
        from: `/#/previous?${sensitiveQuery}`,
        to: `/#/next?${sensitiveQuery}`,
      },
    };

    const result = options.beforeBreadcrumb!(breadcrumb, {});

    expect(result).toBe(breadcrumb);
    for (const key of ['url', 'from', 'to'] as const) {
      expect(breadcrumb.data[key]).toContain('?safe=kept');
      expect(breadcrumb.data[key]).not.toContain('secret');
    }
  });

  it('strips substring-sensitive params the SDK deny-list would catch but exact-match would miss', async () => {
    const options = await getInitOptions();
    // These contain a sensitive substring (token/auth/session) but are not one of
    // the four exact deny-list keys. In HashRouter fragments the SDK filter never
    // runs, so beforeBreadcrumb is the only gate — it must catch them too.
    const query = 'id_token=X&access_token=Y&session_state=Z&authToken=W&safe=kept';
    const breadcrumb = { category: 'navigation', data: { url: `https://app.example.test/#/callback?${query}` } };

    const result = options.beforeBreadcrumb!(breadcrumb, {});

    expect(result).toBe(breadcrumb);
    expect(breadcrumb.data.url).toContain('safe=kept');
    for (const value of ['X', 'Y', 'Z', 'W']) {
      expect(breadcrumb.data.url).not.toContain(`=${value}`);
    }
  });

  it('leaves clean URLs unchanged', async () => {
    const options = await getInitOptions();
    const cleanUrl = '/projects?view=list#details';
    const event = { type: undefined, request: { url: cleanUrl } };

    await options.beforeSend!(event, {});

    expect(event.request.url).toBe(cleanUrl);
  });

  it('stays disabled when the fetched configuration is invalid', async () => {
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockConfig({ FRONTEND_SENTRY_DSN: '', FRONTEND_SENTRY_ENVIRONMENT: 'test' });

    await expect(initializeSentry()).resolves.toEqual({ isSentryEnabled: false });

    expect(initMock).not.toHaveBeenCalled();
    expect(browserTracingIntegrationMock).not.toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalledWith(
      'Invalid or missing Sentry configuration, continuing without Sentry integration',
    );
  });
});
