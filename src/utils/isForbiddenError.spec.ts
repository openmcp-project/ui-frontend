import { describe, it, expect } from 'vitest';
import { isForbiddenError } from './isForbiddenError';

describe('isForbiddenError', () => {
  it('returns false for non-objects', () => {
    expect(isForbiddenError(null)).toBe(false);
    expect(isForbiddenError(undefined)).toBe(false);
    expect(isForbiddenError('403')).toBe(false);
    expect(isForbiddenError(403)).toBe(false);
  });

  it('returns true when status is 403', () => {
    expect(isForbiddenError({ status: 403 })).toBe(true);
  });

  it('returns true when statusCode is 403', () => {
    expect(isForbiddenError({ statusCode: 403 })).toBe(true);
  });

  it('returns true when code is 403', () => {
    expect(isForbiddenError({ code: 403 })).toBe(true);
  });

  it('returns true when message contains 403', () => {
    expect(isForbiddenError({ message: 'Request failed with status 403' })).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(isForbiddenError({ status: 404 })).toBe(false);
    expect(isForbiddenError({ statusCode: 500 })).toBe(false);
    expect(isForbiddenError({ code: 401 })).toBe(false);
    expect(isForbiddenError({ message: 'Request failed with status 404' })).toBe(false);
  });

  it('handles unexpected shapes safely', () => {
    expect(isForbiddenError({ status: '403' })).toBe(false);
    expect(isForbiddenError({ statusCode: '403' })).toBe(false);
    expect(isForbiddenError({ code: '403' })).toBe(false);
    expect(isForbiddenError({ message: 403 })).toBe(false);
  });
});
