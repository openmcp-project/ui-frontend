/** @vitest-environment node */

import { describe, expect, it } from 'vitest';
import {
  AuthConfigurationError,
  ExpectedAuthError,
  UpstreamUnavailableError,
  createOAuthEndpointError,
} from './errors.js';

describe('createOAuthEndpointError', () => {
  it('classifies invalid_grant as an expected, session-ending error', () => {
    const error = createOAuthEndpointError('refresh', 400, JSON.stringify({ error: 'invalid_grant' }));

    expect(error).toBeInstanceOf(ExpectedAuthError);
    expect(error.statusCode).toBe(401);
    expect(error.report).toBe(false);
    expect(error.logLevel).toBe('info');
  });

  it('classifies invalid_client as a configuration defect', () => {
    const error = createOAuthEndpointError('token_exchange', 400, JSON.stringify({ error: 'invalid_client' }));

    expect(error).toBeInstanceOf(AuthConfigurationError);
    expect(error.report).toBe(true);
    expect(error.logLevel).toBe('error');
  });

  it('classifies a 429 rate limit as an upstream blip, not a defect to report', () => {
    const error = createOAuthEndpointError('refresh', 429, '');

    expect(error).toBeInstanceOf(UpstreamUnavailableError);
    expect(error.statusCode).toBe(503);
    expect(error.report).toBe(false);
    expect(error.logLevel).toBe('warn');
  });

  it('classifies an unrecognised 502 as an upstream blip', () => {
    const error = createOAuthEndpointError('token_exchange', 502, '');

    expect(error).toBeInstanceOf(UpstreamUnavailableError);
    expect(error.statusCode).toBe(502);
    expect(error.report).toBe(false);
    expect(error.logLevel).toBe('warn');
  });
});
