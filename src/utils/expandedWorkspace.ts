const STORAGE_KEY_PREFIX = 'expandedWorkspaces:';

function storageKey(projectName: string): string {
  return `${STORAGE_KEY_PREFIX}${projectName}`;
}

export function getExpandedWorkspaces(projectName: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(projectName));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed as string[]);
  } catch {
    return new Set();
  }
}

export function setExpandedWorkspaces(projectName: string, expanded: Set<string>): void {
  if (expanded.size === 0) {
    localStorage.removeItem(storageKey(projectName));
  } else {
    localStorage.setItem(storageKey(projectName), JSON.stringify([...expanded]));
  }
}
