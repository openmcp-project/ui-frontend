const STORAGE_KEY = 'rememberedProject';

export function getRememberedProject(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setRememberedProject(projectName: string): void {
  localStorage.setItem(STORAGE_KEY, projectName);
}

export function clearRememberedProject(): void {
  localStorage.removeItem(STORAGE_KEY);
}
