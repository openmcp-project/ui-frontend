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

export function isNotFoundError(error?: APIError | null): boolean {
  return !!error && (error.status === 404 || error.status === 403);
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
