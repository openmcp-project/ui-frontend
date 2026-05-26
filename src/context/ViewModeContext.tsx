import { createContext, ReactNode, useContext, useState } from 'react';

export type ViewMode = 'beginner' | 'open-source';

const STORAGE_KEY = 'mcp-ui-view-mode';

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'open-source' ? 'open-source' : 'beginner';
  });

  const setMode = (newMode: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    setModeState(newMode);
  };

  return <ViewModeContext.Provider value={{ mode, setMode }}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within a ViewModeProvider');
  return ctx;
}
