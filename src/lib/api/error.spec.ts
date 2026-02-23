import { describe, it, expect } from 'vitest';
import { isNotFoundError, APIError } from './error';
import { ErrorLike } from '@apollo/client';

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

    it('should return true for ErrorLike networkError statusCode', () => {
      expect(isNotFoundError({ networkError: { statusCode: 404 } } as unknown as ErrorLike)).toBe(true);
      expect(isNotFoundError({ networkError: { statusCode: 403 } } as unknown as ErrorLike)).toBe(true);
    });

    it('should return false if error is undefined', () => {
      expect(isNotFoundError(undefined)).toBe(false);
    });

    it('should return false if error is null', () => {
      expect(isNotFoundError(null)).toBe(false);
    });

    it('should return false if error has no status field', () => {
      expect(isNotFoundError({} as ErrorLike)).toBe(false);
    });

    it('should return false if error.status is not 404 or 403', () => {
      expect(isNotFoundError(new APIError('', 500))).toBe(false);
      expect(isNotFoundError(new APIError('', 400))).toBe(false);
      expect(isNotFoundError(new APIError('', 401))).toBe(false);
    });
  });
});
