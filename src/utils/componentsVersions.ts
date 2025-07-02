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
