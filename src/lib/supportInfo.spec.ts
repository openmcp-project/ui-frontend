import { describe, it, expect } from 'vitest';
import type { TFunction } from 'i18next';
import {
  purposeColorScheme,
  purposeIndicationVars,
  isKnownLandscape,
  purposeLabel,
  purposeShortLabel,
} from './supportInfo';

/** Minimal t() stand-in: returns defaultValue when provided, otherwise the key itself. */
const t = ((key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key) as unknown as TFunction;

describe('purposeColorScheme', () => {
  it('returns "1" for production', () => {
    expect(purposeColorScheme('production')).toBe('1');
  });

  it('returns "3" for validation', () => {
    expect(purposeColorScheme('validation')).toBe('3');
  });

  it('returns "4" for testing', () => {
    expect(purposeColorScheme('testing')).toBe('4');
  });

  it('returns "10" for experimental', () => {
    expect(purposeColorScheme('experimental')).toBe('10');
  });

  it('returns "10" for an unknown string', () => {
    expect(purposeColorScheme('random')).toBe('10');
  });

  it('returns "10" for undefined', () => {
    expect(purposeColorScheme(undefined)).toBe('10');
  });
});

describe('purposeIndicationVars', () => {
  it('returns scheme-1 CSS vars for production', () => {
    expect(purposeIndicationVars('production')).toEqual({
      bg: 'var(--sapIndicationColor_1b_Background)',
      text: 'var(--sapIndicationColor_1b_TextColor)',
      hoverBg: 'var(--sapIndicationColor_1b_Hover_Background)',
    });
  });

  it('returns scheme-3 CSS vars for validation', () => {
    expect(purposeIndicationVars('validation')).toEqual({
      bg: 'var(--sapIndicationColor_3b_Background)',
      text: 'var(--sapIndicationColor_3b_TextColor)',
      hoverBg: 'var(--sapIndicationColor_3b_Hover_Background)',
    });
  });

  it('returns scheme-4 CSS vars for testing', () => {
    expect(purposeIndicationVars('testing')).toEqual({
      bg: 'var(--sapIndicationColor_4b_Background)',
      text: 'var(--sapIndicationColor_4b_TextColor)',
      hoverBg: 'var(--sapIndicationColor_4b_Hover_Background)',
    });
  });

  it('returns scheme-10 CSS vars for experimental', () => {
    expect(purposeIndicationVars('experimental')).toEqual({
      bg: 'var(--sapIndicationColor_10b_Background)',
      text: 'var(--sapIndicationColor_10b_TextColor)',
      hoverBg: 'var(--sapIndicationColor_10b_Hover_Background)',
    });
  });

  it('returns scheme-10 CSS vars for an unknown string', () => {
    expect(purposeIndicationVars('random')).toEqual({
      bg: 'var(--sapIndicationColor_10b_Background)',
      text: 'var(--sapIndicationColor_10b_TextColor)',
      hoverBg: 'var(--sapIndicationColor_10b_Hover_Background)',
    });
  });

  it('returns scheme-10 CSS vars for undefined', () => {
    expect(purposeIndicationVars(undefined)).toEqual({
      bg: 'var(--sapIndicationColor_10b_Background)',
      text: 'var(--sapIndicationColor_10b_TextColor)',
      hoverBg: 'var(--sapIndicationColor_10b_Hover_Background)',
    });
  });
});

describe('isKnownLandscape', () => {
  it('returns true for production', () => {
    expect(isKnownLandscape('production')).toBe(true);
  });

  it('returns true for validation', () => {
    expect(isKnownLandscape('validation')).toBe(true);
  });

  it('returns true for testing', () => {
    expect(isKnownLandscape('testing')).toBe(true);
  });

  it('returns true for experimental', () => {
    expect(isKnownLandscape('experimental')).toBe(true);
  });

  it('returns false for undefined', () => {
    expect(isKnownLandscape(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isKnownLandscape('')).toBe(false);
  });

  it('returns false for an arbitrary string', () => {
    expect(isKnownLandscape('random')).toBe(false);
  });
});

describe('purposeLabel', () => {
  it('returns the landscape string as default value for production', () => {
    expect(purposeLabel(t, 'production')).toBe('production');
  });

  it('returns the landscape string as default value for validation', () => {
    expect(purposeLabel(t, 'validation')).toBe('validation');
  });

  it('returns the landscape string as default value for testing', () => {
    expect(purposeLabel(t, 'testing')).toBe('testing');
  });

  it('returns the landscape string as default value for experimental', () => {
    expect(purposeLabel(t, 'experimental')).toBe('experimental');
  });

  it('falls back to the SupportInfo.pleaseSet key for undefined landscape', () => {
    expect(purposeLabel(t, undefined)).toBe('SupportInfo.pleaseSet');
  });
});

describe('purposeShortLabel', () => {
  it('returns the short label for production (defaulting to purposeLabel output)', () => {
    expect(purposeShortLabel(t, 'production')).toBe('production');
  });

  it('returns the short label for validation', () => {
    expect(purposeShortLabel(t, 'validation')).toBe('validation');
  });

  it('returns the short label for testing', () => {
    expect(purposeShortLabel(t, 'testing')).toBe('testing');
  });

  it('returns the short label for experimental', () => {
    expect(purposeShortLabel(t, 'experimental')).toBe('experimental');
  });

  it('returns the ProjectCard.setPurpose key for undefined landscape', () => {
    expect(purposeShortLabel(t, undefined)).toBe('ProjectCard.setPurpose');
  });
});
