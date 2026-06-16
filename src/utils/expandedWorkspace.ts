const STORAGE_KEY_PREFIX = 'expandedWorkspace:';

export function getExpandedWorkspace(projectName: string): string | null {
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectName}`);
}

export function setExpandedWorkspace(projectName: string, workspaceName: string): void {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectName}`, workspaceName);
}

export function clearExpandedWorkspace(projectName: string): void {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectName}`);
}
