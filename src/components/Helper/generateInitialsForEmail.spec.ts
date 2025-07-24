import { describe, it, expect } from 'vitest';
import { generateInitialsForEmail } from './generateInitialsForEmail.ts';

describe('generateInitialsForEmail', () => {
  it('should generate initials from a standard email', () => {
    expect(generateInitialsForEmail('first.last@example.com')).toBe('FL');
  });

  it('should generate initials from an email with a single-part name', () => {
    expect(generateInitialsForEmail('firstlast@example.com')).toBe('F');
  });

  it('should generate initials from an email with multiple name parts', () => {
    expect(generateInitialsForEmail('first.middle.last@example.com')).toBe('FML');
  });

  it('should truncate to 3 initials if more than 3 name parts exist', () => {
    expect(generateInitialsForEmail('first.second.third.extra@example.com')).toBe('FST');
  });

  it('should handle emails where the name part is short', () => {
    expect(generateInitialsForEmail('a.b@example.com')).toBe('AB');
    expect(generateInitialsForEmail('x@example.com')).toBe('X');
  });

  it('should convert initials to uppercase', () => {
    expect(generateInitialsForEmail('first.last@example.com')).toBe('FL');
    expect(generateInitialsForEmail('FiRsT.lAsT@example.com')).toBe('FL');
  });

  it('should handle emails with numbers in the name part', () => {
    expect(generateInitialsForEmail('first1.last2@example.com')).toBe('FL');
    expect(generateInitialsForEmail('1first.2last@example.com')).toBe('12');
  });

  it('should handle emails with leading/trailing dots in the name part gracefully', () => {
    expect(generateInitialsForEmail('.leading.dot@example.com')).toBe('LD');
    expect(generateInitialsForEmail('trailing.dot.@example.com')).toBe('TD');
    expect(generateInitialsForEmail('double..dot@example.com')).toBe('DD');
  });

  it('should return an empty string for undefined input', () => {
    expect(generateInitialsForEmail(undefined)).toBe('');
  });

  it('should return an empty string for an empty string input', () => {
    expect(generateInitialsForEmail('')).toBe('');
  });
});
