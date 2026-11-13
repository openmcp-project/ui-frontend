/**
 * Formats the elapsed time since an ISO timestamp as a compact, two-part duration:
 * `45s`, `30m`, `2h`, `2h 30m`, `1d 23h`, `1w 2d`. Only the two largest non-zero units are
 * shown so the result stays glanceable (e.g. in a tooltip). Returns an empty string for a
 * missing or unparseable date, or a future date.
 */
const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatCompactDurationSince(dateString?: string | null, now: number = Date.now()): string {
  if (!dateString) return '';
  const start = new Date(dateString).getTime();
  if (isNaN(start)) return '';

  let seconds = Math.floor((now - start) / 1000);
  if (seconds < 0) return '';
  if (seconds < MINUTE) return `${seconds}s`;

  const parts: string[] = [];
  const push = (value: number, unit: string) => {
    if (value > 0) parts.push(`${value}${unit}`);
  };

  const weeks = Math.floor(seconds / WEEK);
  seconds -= weeks * WEEK;
  const days = Math.floor(seconds / DAY);
  seconds -= days * DAY;
  const hours = Math.floor(seconds / HOUR);
  seconds -= hours * HOUR;
  const minutes = Math.floor(seconds / MINUTE);

  push(weeks, 'w');
  push(days, 'd');
  push(hours, 'h');
  push(minutes, 'm');

  // Keep only the two largest non-zero units.
  return parts.slice(0, 2).join(' ');
}
