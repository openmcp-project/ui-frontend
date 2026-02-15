import { describe, it, expect } from 'vitest';
import { getErrorStatusCode, isNotFoundError, APIError } from './error';

describe('error', () => {
  describe('isNotFoundError', () => {
    it('should return true if error.status is 404', () => {
      expect(isNotFoundError(new APIError('', 404))).toBe(true);
      expect(isNotFoundError(new APIError('not found', 404))).toBe(true);
    });

    it('should return true if error.status is 403', () => {
      expect(isNotFoundError(new APIError('', 403))).toBe(true);
      expect(isNotFoundError(new APIError('not found', 403))).toBe(true);
    });

    it('should return true if error.statusCode or error.code is 404/403', () => {
      expect(isNotFoundError({ statusCode: 404 })).toBe(true);
      expect(isNotFoundError({ statusCode: 403 })).toBe(true);
      expect(isNotFoundError({ code: 404 })).toBe(true);
      expect(isNotFoundError({ code: 403 })).toBe(true);
    });

    it('should return false if error is undefined', () => {
      expect(isNotFoundError(undefined)).toBe(false);
    });

    it('should return false if error is null', () => {
      expect(isNotFoundError(null)).toBe(false);
    });

    it('should return false if error has no status field', () => {
      expect(isNotFoundError({} as APIError)).toBe(false);
    });

    it('should return false if error.status is not 404 or 403', () => {
      expect(isNotFoundError(new APIError('', 500))).toBe(false);
      expect(isNotFoundError(new APIError('', 400))).toBe(false);
      expect(isNotFoundError(new APIError('', 401))).toBe(false);
    });
  });

  describe('getErrorStatusCode', () => {
    it('should return status for APIError', () => {
      expect(getErrorStatusCode(new APIError('not found', 404))).toBe(404);
      expect(getErrorStatusCode(new APIError('forbidden', 403))).toBe(403);
    });

    it('should return statusCode from networkError', () => {
      expect(getErrorStatusCode({ networkError: { statusCode: 404 } })).toBe(404);
      expect(getErrorStatusCode({ networkError: { statusCode: 403 } })).toBe(403);
    });

    it('should return undefined for unknown errors', () => {
      expect(getErrorStatusCode(undefined)).toBeUndefined();
      expect(getErrorStatusCode(null)).toBeUndefined();
      expect(getErrorStatusCode({})).toBeUndefined();
      expect(getErrorStatusCode({ networkError: {} })).toBeUndefined();
    });
  });
});
