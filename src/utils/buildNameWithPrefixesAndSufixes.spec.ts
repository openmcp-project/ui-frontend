import { buildNameWithPrefixesAndSufixes } from './buildNameWithPrefixesAndSufixes';
import { describe, it, expect } from 'vitest';

describe('buildNameWithPrefixesAndSufixes', () => {
  it('returns provided values when no affixes provided', () => {
    const { finalName, finalDisplayName } = buildNameWithPrefixesAndSufixes('name', 'Display', {});
    expect(finalName).to.equal('name');
    expect(finalDisplayName).to.equal('Display');
  });

  it('applies prefix only', () => {
    const { finalName, finalDisplayName } = buildNameWithPrefixesAndSufixes('name', 'displayName', {
      namePrefix: 'pre-',
      displayNamePrefix: 'PRE-',
    });
    expect(finalName).to.equal('pre-name');
    expect(finalDisplayName).to.equal('PRE-displayName');
  });

  it('applies suffix only', () => {
    const { finalName, finalDisplayName } = buildNameWithPrefixesAndSufixes('name', 'displayName', {
      nameSuffix: '-suf',
      displayNameSuffix: 'SUF',
    });
    expect(finalName).to.equal('name-suf');
    expect(finalDisplayName).to.equal('displayNameSUF');
  });

  it('applies both prefix and suffix', () => {
    const { finalName, finalDisplayName } = buildNameWithPrefixesAndSufixes('name', 'displayName', {
      namePrefix: 'pre-',
      nameSuffix: '-suf',
      displayNamePrefix: 'PRE',
      displayNameSuffix: 'SUF',
    });
    expect(finalName).to.equal('pre-name-suf');
    expect(finalDisplayName).to.equal('PREdisplayNameSUF');
  });

  it('trims whitespace around affixes', () => {
    const { finalName, finalDisplayName } = buildNameWithPrefixesAndSufixes('name', 'displayName', {
      namePrefix: '  pre- ',
      nameSuffix: ' -suf  ',
      displayNamePrefix: '  PRE ',
      displayNameSuffix: ' SUF   ',
    });
    expect(finalName).to.equal('pre-name-suf');
    expect(finalDisplayName).to.equal('PREdisplayNameSUF');
  });
});
