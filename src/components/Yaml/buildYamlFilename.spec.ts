import { describe, expect, it } from 'vitest';

import { buildYamlFilename } from './buildYamlFilename';

describe('buildYamlFilename', () => {
  it('joins kind and name with an underscore when both are present', () => {
    expect(buildYamlFilename('Crossplane', 'my-cp')).toBe('Crossplane_my-cp');
  });

  it('returns just the kind when name is missing', () => {
    expect(buildYamlFilename('Crossplane', undefined)).toBe('Crossplane');
  });

  it('returns just the name when kind is missing', () => {
    expect(buildYamlFilename(undefined, 'my-cp')).toBe('my-cp');
  });

  it('returns an empty string when both are missing', () => {
    expect(buildYamlFilename(undefined, undefined)).toBe('');
  });
});
