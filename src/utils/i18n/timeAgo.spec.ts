import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { formatDateAsTimeAgo } from './timeAgo.ts';

const MOCK_DATE = '2025-08-11T12:00:00.000Z';

describe('formatDateAsTimeAgo', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(MOCK_DATE));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should format a recent ISO date string correctly', () => {
    const date = '2025-08-11T11:59:00.000Z';
    expect(formatDateAsTimeAgo(date)).toBe('1 minute ago');
  });

  it('should format a date string from a few hours ago', () => {
    const date = '2025-08-11T09:00:00.000Z';
    expect(formatDateAsTimeAgo(date)).toBe('3 hours ago');
  });

  it('should return an empty string for an invalid date string', () => {
    const invalidDate = '[INVALID DATE]';
    expect(formatDateAsTimeAgo(invalidDate)).toBe('');
  });

  it('should return an empty string for an empty input string', () => {
    expect(formatDateAsTimeAgo('')).toBe('');
  });

  it('should return an empty string for null input', () => {
    // @ts-expect-error: Ensuring the function is robust against non-string runtime values
    expect(formatDateAsTimeAgo(null)).toBe('');
  });

  it('should return an empty string for an undefined input', () => {
    // @ts-expect-error: Ensuring the function is robust against non-string runtime values
    expect(formatDateAsTimeAgo(undefined)).toBe('');
  });
});
