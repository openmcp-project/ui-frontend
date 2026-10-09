/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationError } from '../../errors.js';
import { initSentry } from './sentry.js';

type InitOptions = NonNullable<Parameters<(typeof import('@sentry/node'))['init']>[0]>;
type FastifyIntegrationOptions = Parameters<(typeof import('@sentry/node'))['fastifyIntegration']>[0];

const sentryMocks = vi.hoisted(() => ({
  init: vi.fn(),
  fastifyIntegration: vi.fn((options: unknown) => ({ name: 'Fastify', options })),
}));

vi.mock('@sentry/node', () => sentryMocks);

function getInitOptions(): InitOptions {
  expect(sentryMocks.init).toHaveBeenCalledOnce();
  return sentryMocks.init.mock.calls[0][0] as InitOptions;
}

function getBeforeSend(): NonNullable<InitOptions['beforeSend']> {
  const beforeSend = getInitOptions().beforeSend;
  expect(beforeSend).toBeTypeOf('function');
  return beforeSend!;
}

describe('initSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BFF_SENTRY_DSN', 'https://public@example.test/1');
    vi.stubEnv('FRONTEND_SENTRY_ENVIRONMENT', 'test');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('disables sensitive data collection', () => {
    initSentry();

    expect(getInitOptions().dataCollection).toEqual({
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
    });
  });

  it('removes sensitive request data while preserving safe query parameters', async () => {
    initSentry();

    const event = await getBeforeSend()(
      {
        type: undefined,
        request: {
          url: 'https://example.test/auth/callback?Code=secret&STATE=nonce&ToKeN=bearer&APIKEY=key&safe=value',
          query_string: 'Code=secret&STATE=nonce&ToKeN=bearer&APIKEY=key&safe=value',
          data: JSON.stringify({ kubeconfig: 'secret-kubeconfig' }),
        },
      },
      {},
    );

    expect(event?.request?.url).toBe('https://example.test/auth/callback?safe=value');
    expect(event?.request?.query_string).toBe('safe=value');
    expect(event?.request).not.toHaveProperty('data');
  });

  it('clears cookie values that reach the event boundary', async () => {
    initSentry();

    const event = await getBeforeSend()(
      { type: undefined, request: { cookies: { session: 'secret', preference: 'compact' } } },
      {},
    );

    expect(event?.request?.cookies).toEqual({ session: '', preference: '' });
  });

  it('strips substring-sensitive params the exact-match list would miss', async () => {
    initSentry();

    const event = await getBeforeSend()(
      {
        type: undefined,
        request: {
          url: 'https://example.test/cb?access_token=X&session_state=Y&authToken=W&safe=value',
          query_string: 'access_token=X&session_state=Y&authToken=W&safe=value',
        },
      },
      {},
    );

    expect(event?.request?.url).toBe('https://example.test/cb?safe=value');
    expect(event?.request?.query_string).toBe('safe=value');
  });

  it('clears header values that reach the event boundary', async () => {
    initSentry();

    const event = await getBeforeSend()(
      { type: undefined, request: { headers: { authorization: 'Bearer secret', 'content-type': 'application/json' } } },
      {},
    );

    expect(event?.request?.headers).toEqual({ authorization: '', 'content-type': '' });
  });

  it('replaces the default Fastify integration and preserves its error policy', () => {
    initSentry();

    const defaultIntegrations = [{ name: 'Fastify' }, { name: 'Other' }];
    const integrations = getInitOptions().integrations;
    expect(integrations).toBeTypeOf('function');
    expect((integrations as (defaults: typeof defaultIntegrations) => unknown[])(defaultIntegrations)).toEqual([
      { name: 'Other' },
      expect.objectContaining({ name: 'Fastify' }),
    ]);

    const fastifyOptions = sentryMocks.fastifyIntegration.mock.calls[0][0] as NonNullable<FastifyIntegrationOptions>;
    const applicationError = new ApplicationError('expected failure', {
      code: 'EXPECTED',
      statusCode: 500,
      publicMessage: 'Expected failure',
      logLevel: 'error',
      report: true,
    });

    expect(fastifyOptions.shouldHandleError?.(applicationError, {} as never, { statusCode: 500 } as never)).toBe(false);
    expect(fastifyOptions.shouldHandleError?.(new Error('unexpected'), {} as never, { statusCode: 500 } as never)).toBe(
      true,
    );
    expect(
      fastifyOptions.shouldHandleError?.(new Error('client failure'), {} as never, { statusCode: 400 } as never),
    ).toBe(false);
  });

  it('does not initialize without a DSN', () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubEnv('BFF_SENTRY_DSN', '   ');

    initSentry();

    expect(sentryMocks.init).not.toHaveBeenCalled();
    expect(errorMock).toHaveBeenCalledWith('Error: Sentry DSN is not provided. Sentry will not be initialized.');
  });
});
