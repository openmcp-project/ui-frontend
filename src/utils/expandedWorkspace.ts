const STORAGE_KEY_PREFIX = 'expandedWorkspace:';

function storageKey(projectName: string): string {
  return `${STORAGE_KEY_PREFIX}${projectName}`;
}

export function getExpandedWorkspace(projectName: string): string | null {
  try {
    return localStorage.getItem(storageKey(projectName));
  } catch {
    return null;
  }
}

export function setExpandedWorkspace(projectName: string, workspaceName: string | null): void {
  try {
    if (workspaceName === null) {
      localStorage.removeItem(storageKey(projectName));
    } else {
      localStorage.setItem(storageKey(projectName), workspaceName);
    }
  } catch {
    // ignore
  }
}
