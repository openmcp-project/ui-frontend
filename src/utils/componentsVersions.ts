const MANAGED_SERVICE_VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-(\d+))?$/;

interface ParsedManagedServiceVersion {
  major: number;
  minor: number;
  patch: number;
  build: number;
}

const parseManagedServiceVersion = (version: string): ParsedManagedServiceVersion | null => {
  const match = MANAGED_SERVICE_VERSION_PATTERN.exec(version);
  if (!match) return null;
  const [, major, minor, patch, build] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch), build: Number(build ?? 0) };
};

const compareParsedVersions = (a: ParsedManagedServiceVersion, b: ParsedManagedServiceVersion): number => {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  return a.build - b.build;
};

// Picks the highest version from strings shaped like "v1.2.3" or "v1.2.3-4" (optional "v" prefix, optional build suffix).
// Falls back to the first array element when any entry doesn't match that shape, since versions can't be reliably compared then.
export const getHighestVersion = (versions: string[]): string | undefined => {
  if (versions.length === 0) return undefined;

  const parsed = versions.map(parseManagedServiceVersion);
  if (!parsed.every((p): p is ParsedManagedServiceVersion => p !== null)) {
    return versions[0];
  }

  let highestIndex = 0;
  for (let i = 1; i < versions.length; i++) {
    if (compareParsedVersions(parsed[i], parsed[highestIndex]) > 0) {
      highestIndex = i;
    }
  }
  return versions[highestIndex];
};

export type VersionDiff = 'major' | 'minor' | 'patch';

/** Returns the type of version bump from `selected` to `latest`, or null if selected is already
 *  up-to-date (or versions can't be parsed). */
export const getVersionDiff = (selected: string, latest: string): VersionDiff | null => {
  const a = parseManagedServiceVersion(selected);
  const b = parseManagedServiceVersion(latest);
  if (!a || !b || compareParsedVersions(a, b) >= 0) return null;
  if (a.major !== b.major) return 'major';
  if (a.minor !== b.minor) return 'minor';
  return 'patch';
};

// Sorts latest first, including optional "v" prefixes and numeric build suffixes.
export const sortVersions = (versions: string[]): string[] => {
  return versions.slice().sort((a, b) => {
    const aParts = parseManagedServiceVersion(a);
    const bParts = parseManagedServiceVersion(b);

    // Parseable versions before non-parseable; among non-parseable use localeCompare (both fallbacks are transitive)
    if (!aParts || !bParts) {
      if (!aParts && !bParts) return b.localeCompare(a);
      return !aParts ? 1 : -1;
    }

    return compareParsedVersions(bParts, aParts);
  });
};
