import { createContext, ReactNode, useContext, useState } from 'react';

export type ViewMode = 'beginner' | 'open-source';

const STORAGE_KEY = 'mcp-ui-view-mode';

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  headlampAvailable: boolean;
  setHeadlampAvailable: (available: boolean) => void;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'open-source' ? 'open-source' : 'beginner';
  });
  const [headlampAvailable, setHeadlampAvailable] = useState(true);

  const setMode = (newMode: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    setModeState(newMode);
  };

  return (
    <ViewModeContext.Provider value={{ mode, setMode, headlampAvailable, setHeadlampAvailable }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within a ViewModeProvider');
  return ctx;
}
