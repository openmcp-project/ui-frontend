import { createContext, ReactNode, useContext, useState } from 'react';
import { useFrontendConfig } from './FrontendConfigContext.tsx';

export type ViewMode = 'beginner' | 'open-source';

const STORAGE_KEY = 'mcp-ui-view-mode';

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  headlampAvailable: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { featureToggles } = useFrontendConfig();
  const headlampAvailable = featureToggles.enableHeadlamp;

  const [mode, setModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'open-source' && headlampAvailable ? 'open-source' : 'beginner';
  });

  const setMode = (newMode: ViewMode) => {
    const resolved = newMode === 'open-source' && !headlampAvailable ? 'beginner' : newMode;
    localStorage.setItem(STORAGE_KEY, resolved);
    setModeState(resolved);
  };

  return <ViewModeContext.Provider value={{ mode, setMode, headlampAvailable }}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within a ViewModeProvider');
  return ctx;
}
