import { createContext, ReactNode, use, useCallback, useState } from 'react';
import { ApiConfig } from '../lib/api/types/apiConfig';

export interface McpTarget {
  name: string;
  apiConfig: ApiConfig;
}

interface YamlApplyContextType {
  activeMcp: McpTarget | null;
  pendingFile: File | null;
  setActiveMcp: (target: McpTarget | null) => void;
  requestApplyFile: (file: File) => void;
  clearPendingFile: () => void;
}

const YamlApplyContext = createContext<YamlApplyContextType | null>(null);

export function YamlApplyContextProvider({ children }: { children: ReactNode }) {
  const [activeMcp, setActiveMcp] = useState<McpTarget | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const requestApplyFile = useCallback((file: File) => {
    setPendingFile(file);
  }, []);

  const clearPendingFile = useCallback(() => {
    setPendingFile(null);
  }, []);

  return (
    <YamlApplyContext
      value={{
        activeMcp,
        pendingFile,
        setActiveMcp,
        requestApplyFile,
        clearPendingFile,
      }}
    >
      {children}
    </YamlApplyContext>
  );
}

export function useYamlApply(): YamlApplyContextType {
  const ctx = use(YamlApplyContext);
  if (!ctx) throw new Error('useYamlApply must be used within YamlApplyContextProvider');
  return ctx;
}
