export function buildNameWithPrefixesAndSuffixes(
  name: string | undefined,
  displayName: string | undefined,
  affixes?: {
    namePrefix?: string;
    nameSuffix?: string;
    displayNamePrefix?: string;
    displayNameSuffix?: string;
  },
): { finalName: string; finalDisplayName: string } {
  const applyAffixes = (value: string | undefined, prefix?: string, suffix?: string) => {
    const p = (prefix ?? '').trim();
    const s = (suffix ?? '').trim();
    if (!p && !s) return value ?? '';
    let middle = value ?? '';
    if (p && middle.startsWith(p)) middle = middle.slice(p.length);
    if (s && middle.endsWith(s)) middle = middle.slice(0, middle.length - s.length);
    return `${p}${middle}${s}`;
  };

  const finalName = applyAffixes(name, affixes?.namePrefix, affixes?.nameSuffix);
  const finalDisplayName = applyAffixes(displayName, affixes?.displayNamePrefix, affixes?.displayNameSuffix);

  return { finalName, finalDisplayName };
}
