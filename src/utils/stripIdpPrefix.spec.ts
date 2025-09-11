import { describe, it, expect } from 'vitest';
import { stripIdpPrefix } from './stripIdpPrefix';

describe('stripIdpPrefix', () => {
  it('removes known idp prefix when it matches', () => {
    expect(stripIdpPrefix('openmcp:john@doe.com', 'openmcp')).to.equal('john@doe.com');
  });

  it('falls back to removing text before first colon when idpPrefix does not match', () => {
    expect(stripIdpPrefix('azuread:svc-account', 'openmcp')).to.equal('svc-account');
  });

  it('removes text before the first colon when idpPrefix is not provided', () => {
    expect(stripIdpPrefix('anything:rest')).to.equal('rest');
  });

  it('returns original value when there is no colon', () => {
    expect(stripIdpPrefix('john@doe.com')).to.equal('john@doe.com');
  });

  it('handles empty string input', () => {
    expect(stripIdpPrefix('')).to.equal('');
  });

  it('removes only the first matching prefix (supports multiple colons)', () => {
    expect(stripIdpPrefix('p1:p2:val', 'p1')).to.equal('p2:val');
  });

  it('with empty idpPrefix still uses fallback behavior', () => {
    expect(stripIdpPrefix('prefix:value', '')).to.equal('value');
  });

  it('when principal starts with non-matching similar text, uses fallback', () => {
    expect(stripIdpPrefix('openmcpuser:john', 'openmcp')).to.equal('john');
  });
});
