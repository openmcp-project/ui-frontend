import { describe, it, expect, afterAll } from 'vitest';
import { getRedirectSuffix } from './getRedirectSuffix';

const originalLocation = globalThis.location;

function mockLocation(search: string, hash: string) {
  Object.defineProperty(globalThis, 'location', {
    value: { ...originalLocation, search, hash },
    writable: true,
    configurable: true,
  });
}

// Restore the real object once all tests have finished
afterAll(() => {
  Object.defineProperty(globalThis, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe('getRedirectSuffix()', () => {
  it('returns "/{search}{hash}" when both parts are present', () => {
    mockLocation('?sap-theme=sap_horizon', '#/mcp/projects');
    expect(getRedirectSuffix()).toBe('/?sap-theme=sap_horizon#/mcp/projects');
  });

  it('returns "/{search}" when only the query string exists', () => {
    mockLocation('?query=foo', '');
    expect(getRedirectSuffix()).toBe('/?query=foo');
  });

  it('returns "{hash}" when only the hash fragment exists', () => {
    mockLocation('', '#/dashboard');
    expect(getRedirectSuffix()).toBe('#/dashboard');
  });

  it('returns an empty string when neither search nor hash exist', () => {
    mockLocation('', '');
    expect(getRedirectSuffix()).toBe('');
  });
});
