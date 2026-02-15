import type { ErrorLike } from '../../utils/isForbiddenError.ts';

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

export function isNotFoundError(error?: ErrorLike | null): boolean {
  if (!error || typeof error !== 'object') return false;

  const status = typeof error.status === 'number' ? error.status : undefined;
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : undefined;
  const code = typeof error.code === 'number' ? error.code : undefined;

  return status === 404 || status === 403 || statusCode === 404 || statusCode === 403 || code === 404 || code === 403;
}

export function getErrorStatusCode(error: unknown): number | undefined {
  if (error instanceof APIError) {
    return error.status;
  }

  if (error && typeof error === 'object' && 'networkError' in error) {
    const networkError = (error as { networkError?: unknown }).networkError;
    if (networkError && typeof networkError === 'object' && 'statusCode' in networkError) {
      const statusCode = (networkError as { statusCode?: number }).statusCode;
      return typeof statusCode === 'number' ? statusCode : undefined;
    }
  }

  return undefined;
}
