import { describe, expect, it } from 'vitest';
import { formatCompactDurationSince } from './compactDuration.ts';

const NOW = new Date('2026-11-12T12:00:00.000Z').getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

describe('formatCompactDurationSince', () => {
  it('formats seconds under a minute', () => {
    expect(formatCompactDurationSince(ago(45 * SECOND), NOW)).toBe('45s');
  });

  it('formats whole minutes', () => {
    expect(formatCompactDurationSince(ago(30 * MINUTE), NOW)).toBe('30m');
  });

  it('formats whole hours', () => {
    expect(formatCompactDurationSince(ago(2 * HOUR), NOW)).toBe('2h');
  });

  it('shows the two largest units (hours and minutes)', () => {
    expect(formatCompactDurationSince(ago(2 * HOUR + 30 * MINUTE), NOW)).toBe('2h 30m');
  });

  it('shows days and hours together', () => {
    expect(formatCompactDurationSince(ago(DAY + 23 * HOUR), NOW)).toBe('1d 23h');
  });

  it('shows weeks and days together', () => {
    expect(formatCompactDurationSince(ago(WEEK + 2 * DAY), NOW)).toBe('1w 2d');
  });

  it('caps at the two largest units and drops smaller ones', () => {
    expect(formatCompactDurationSince(ago(WEEK + 2 * DAY + 5 * HOUR + 10 * MINUTE), NOW)).toBe('1w 2d');
  });

  it('returns an empty string for missing, invalid, or future dates', () => {
    expect(formatCompactDurationSince(undefined, NOW)).toBe('');
    expect(formatCompactDurationSince(null, NOW)).toBe('');
    expect(formatCompactDurationSince('[INVALID]', NOW)).toBe('');
    expect(formatCompactDurationSince(ago(-HOUR), NOW)).toBe('');
  });
});
