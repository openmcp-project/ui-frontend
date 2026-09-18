import { createContext, FC, ReactNode, useCallback, useContext, useState } from 'react';
import { ApiConfig } from '../lib/api/types/apiConfig';

export type McpTarget = {
  name: string;
  apiConfig: ApiConfig;
};

interface YamlApplyContextValue {
  activeMcp: McpTarget | null;
  setActiveMcp: (target: McpTarget | null) => void;
  /** The file currently queued for the apply flow (from a drop or the Upload YAML button). */
  pendingFile: File | null;
  /** Programmatically start the apply flow for a file (e.g. from an "Upload YAML" button). */
  requestApplyFile: (file: File) => void;
  /** Clear the queued file (closes the apply dialog). */
  clearPendingFile: () => void;
}

const YamlApplyContext = createContext<YamlApplyContextValue | null>(null);

export const useYamlApply = (): YamlApplyContextValue => {
  const ctx = useContext(YamlApplyContext);
  if (!ctx) throw new Error('useYamlApply must be used within YamlApplyContextProvider');
  return ctx;
};

export const YamlApplyContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeMcp, setActiveMcpState] = useState<McpTarget | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const setActiveMcp = useCallback((target: McpTarget | null) => setActiveMcpState(target), []);
  const requestApplyFile = useCallback((file: File) => setPendingFile(file), []);
  const clearPendingFile = useCallback(() => setPendingFile(null), []);

  return (
    <YamlApplyContext.Provider value={{ activeMcp, setActiveMcp, pendingFile, requestApplyFile, clearPendingFile }}>
      {children}
    </YamlApplyContext.Provider>
  );
};
