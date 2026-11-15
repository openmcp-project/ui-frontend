import { trace } from '@opentelemetry/api';
import pino from 'pino';

const isLocalDev = process.argv.includes('--local-dev');

const level = process.env.LOG_LEVEL ?? 'info';
const formatEnv = process.env.LOG_FORMAT ?? (isLocalDev ? 'pretty' : 'json');
const wantsPretty = formatEnv === 'pretty';

let transport: pino.TransportSingleOptions | undefined;
if (wantsPretty) {
  try {
    // Resolve pino-pretty before configuring the transport — it is a devDependency
    // and will not be present in the production image.
    await import('pino-pretty');
    transport = {
      target: 'pino-pretty',
      options: { singleLine: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,reqId,event' },
    };
  } catch {
    // pino-pretty not installed — fall back to JSON and warn once.
  }
}

export const logger = pino({
  level,
  ...(transport && { transport }),
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};
    const ctx = span.spanContext();
    return { trace_id: ctx.traceId, span_id: ctx.spanId };
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.kubeconfig',
      '*.accessToken',
      '*.refreshToken',
      '*.token',
    ],
    censor: '[redacted]',
  },
});

if (wantsPretty && !transport) {
  logger.warn({ component: 'logger' }, 'LOG_FORMAT=pretty but pino-pretty is not installed, falling back to JSON');
}
