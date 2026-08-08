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

// Function to sort version strings by major, minor, patch (latest version first)
export const sortVersions = (versions: string[]): string[] => {
  return versions.slice().sort((a, b) => {
    const parse = (v: string) => {
      const parts = v.split('.');
      // Fallback: if not 3 parts or not all numbers, treat as string
      if (parts.length !== 3 || parts.some((p) => isNaN(Number(p)))) {
        return null;
      }
      return parts.map(Number);
    };
    const aParts = parse(a);
    const bParts = parse(b);

    // If either version is not in the expected format, fallback to string comparison (reverse order)
    if (!aParts || !bParts) {
      return b.localeCompare(a);
    }

    const [aMajor, aMinor, aPatch] = aParts;
    const [bMajor, bMinor, bPatch] = bParts;
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });
};
