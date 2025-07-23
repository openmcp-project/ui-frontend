import { describe, it, expect } from 'vitest';
import { resolveTheme } from './ThemeManager.tsx';

describe('ThemeManager', () => {
  describe('resolveTheme()', () => {
    it('returns theme coming from URL when it is truthy', () => {
      expect(resolveTheme('sap_fiori_3', true)).toBe('sap_fiori_3');
      expect(resolveTheme('custom_theme', false)).toBe('custom_theme');
    });

    it('falls back to dark default when URL theme is falsy and user prefers dark mode', () => {
      expect(resolveTheme(null, true)).toBe('sap_horizon_dark');
      expect(resolveTheme('', true)).toBe('sap_horizon_dark');
    });

    it('falls back to light default when URL theme is falsy and user prefers light mode', () => {
      expect(resolveTheme(null, false)).toBe('sap_horizon');
      expect(resolveTheme('', false)).toBe('sap_horizon');
    });
  });
});
