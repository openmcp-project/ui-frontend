export type ApplicationErrorLogLevel = 'info' | 'warn' | 'error';

interface ApplicationErrorOptions {
  code: string;
  statusCode: number;
  publicMessage: string;
  logLevel: ApplicationErrorLogLevel;
  report: boolean;
  context?: Readonly<Record<string, unknown>>;
  cause?: unknown;
}

/**
 * An intentional application error whose HTTP response and observability policy
 * are known at the point where the error is created.
 */
export class ApplicationError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly publicMessage: string;
  readonly logLevel: ApplicationErrorLogLevel;
  readonly report: boolean;
  readonly context?: Readonly<Record<string, unknown>>;

  constructor(message: string, options: ApplicationErrorOptions) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.publicMessage = options.publicMessage;
    this.logLevel = options.logLevel;
    this.report = options.report;
    this.context = options.context;
    Error.captureStackTrace(this, this.constructor);
  }
}
