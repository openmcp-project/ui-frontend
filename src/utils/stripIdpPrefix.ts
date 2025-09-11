export function stripIdpPrefix(principal: string, idpPrefix?: string): string {
  const value = String(principal ?? '');
  const expected = idpPrefix ? `${idpPrefix}:` : '';

  if (expected && value.startsWith(expected)) {
    return value.slice(expected.length);
  }

  const firstColonIndex = value.indexOf(':');
  return firstColonIndex >= 0 ? value.slice(firstColonIndex + 1) : value;
}
