import { describe, it, expect } from 'vitest';
import { isNotFoundError, isForbiddenError, isUnauthorizedError, APIError } from './error';
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

  describe('isForbiddenError', () => {
    it('should return true for APIError with status 403', () => {
      expect(isForbiddenError(new APIError('', 403))).toBe(true);
    });

    it('should return true for ErrorLike networkError with statusCode 403', () => {
      expect(isForbiddenError({ networkError: { statusCode: 403 } } as unknown as ErrorLike)).toBe(true);
    });

    it('should return true when error message contains "is forbidden"', () => {
      const error = new Error(
        'unable to list objects: managedcontrolplanes.core.openmcp.cloud is forbidden: User "foo"',
      );
      expect(isForbiddenError(error as unknown as ErrorLike)).toBe(true);
    });

    it('should return false for status 404', () => {
      expect(isForbiddenError(new APIError('', 404))).toBe(false);
    });

    it('should return false for other statuses', () => {
      expect(isForbiddenError(new APIError('', 500))).toBe(false);
      expect(isForbiddenError(undefined)).toBe(false);
      expect(isForbiddenError(null)).toBe(false);
    });
  });

  describe('isUnauthorizedError', () => {
    it('should return true for APIError with status 401', () => {
      expect(isUnauthorizedError(new APIError('Session expired', 401))).toBe(true);
    });

    it('should return true for ErrorLike networkError with statusCode 401', () => {
      expect(isUnauthorizedError({ networkError: { statusCode: 401 } } as unknown as ErrorLike)).toBe(true);
    });

    it('should return true when the message carries "status code 401" (Apollo-style)', () => {
      const error = new Error('Response not successful: Received status code 401');
      expect(isUnauthorizedError(error as unknown as ErrorLike)).toBe(true);
    });

    it('should return false for other statuses / nullish', () => {
      expect(isUnauthorizedError(new APIError('', 403))).toBe(false);
      expect(isUnauthorizedError(new APIError('', 500))).toBe(false);
      expect(isUnauthorizedError(undefined)).toBe(false);
      expect(isUnauthorizedError(null)).toBe(false);
    });
  });
});
