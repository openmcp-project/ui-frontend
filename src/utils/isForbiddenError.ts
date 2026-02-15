export type ErrorLike = {
  status?: unknown;
  statusCode?: unknown;
  code?: unknown;
  message?: unknown;
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export const isForbiddenError = (error: unknown): boolean => {
  if (!isObject(error)) return false;

  const e = error as ErrorLike;

  const status = typeof e.status === 'number' ? e.status : undefined;
  const statusCode = typeof e.statusCode === 'number' ? e.statusCode : undefined;
  const code = typeof e.code === 'number' ? e.code : undefined;

  if (status === 403 || statusCode === 403 || code === 403) return true;

  const msg = typeof e.message === 'string' ? e.message : '';
  if (msg.includes('403')) return true;

  return false;
};
