import { useCallback, useState } from 'react';
import {
  clearRememberedProject as clearStorage,
  getRememberedProject,
  setRememberedProject as setStorage,
} from '../utils/rememberedProject.ts';

export function useRememberedProject() {
  const [rememberedProject, setRememberedProjectState] = useState<string | null>(getRememberedProject);

  const setRememberedProject = useCallback((projectName: string) => {
    setStorage(projectName);
    setRememberedProjectState(projectName);
  }, []);

  const clearRememberedProject = useCallback(() => {
    clearStorage();
    setRememberedProjectState(null);
  }, []);

  return { rememberedProject, setRememberedProject, clearRememberedProject };
}
