import type { ErrorLike } from '@apollo/client';

export class APIError extends Error {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: any;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;

    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class ValidationError extends Error {
  field: string;

  constructor(message: string, field: string) {
    super(message);
    this.field = field;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export function isNotFoundError(error?: ErrorLike | APIError | null): boolean {
  return hasHttpStatus(error, 403, 404);
}

export function isForbiddenError(error?: ErrorLike | APIError | null): boolean {
  if (hasHttpStatus(error, 403)) return true;
  return error?.message?.includes('is forbidden') ?? false;
}

/**
 * True for an HTTP 401 — an Apollo network error, our REST `APIError`, or an
 * Apollo error whose message carries the status code (e.g. "Received status
 * code 401"). Used as a backstop so a stray 401 redirects to sign-in instead
 * of rendering a dead-end error screen.
 */
export function isUnauthorizedError(error?: ErrorLike | APIError | null): boolean {
  if (hasHttpStatus(error, 401)) return true;
  return /(status code|statuscode)\s*401\b/i.test(error?.message ?? '');
}

function hasHttpStatus(error: ErrorLike | APIError | null | undefined, ...codes: number[]): boolean {
  if (error instanceof APIError) {
    return codes.includes(error.status);
  }

  if (error && typeof error === 'object' && 'networkError' in error) {
    const networkError = (error as { networkError?: unknown }).networkError;
    if (networkError && typeof networkError === 'object') {
      const statusCode = (networkError as { statusCode?: unknown }).statusCode;
      if (typeof statusCode === 'number' && codes.includes(statusCode)) return true;
    }
  }

  return false;
}
