import { expect } from 'vitest';

/**
 * Asserts that `value` is neither `null` nor `undefined` (non-nullish).
 * Narrows the type, so that subsequent type assertions (!) become unnecessary.
 */
export function assertNonNullish<T>(value: T): asserts value is NonNullable<T> {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
}

/**
 * Asserts that `value` is a `string`.
 * Narrows the type of `value` to `string` after this call.
 */
export function assertString(value: unknown): asserts value is string {
  expect(typeof value).toBe('string');
}
