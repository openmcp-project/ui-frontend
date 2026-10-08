import { createContext, FC, ReactNode, useCallback, useContext, useState } from 'react';
import { ApiConfig } from '../lib/api/types/apiConfig';

export type McpTarget = {
  name: string;
  apiConfig: ApiConfig;
};

interface YamlApplyContextValue {
  activeMcp: McpTarget | null;
  setActiveMcp: (target: McpTarget | null) => void;
  /** The files currently queued for the apply flow (from a drop or the Upload YAML button). */
  pendingFiles: File[];
  /** Programmatically start the apply flow for one or more files (e.g. from an "Upload YAML" button). */
  requestApplyFiles: (files: File[]) => void;
  /** Clear the queued files (closes the apply dialog). */
  clearPendingFiles: () => void;
}

const YamlApplyContext = createContext<YamlApplyContextValue | null>(null);

export const useYamlApply = (): YamlApplyContextValue => {
  const ctx = useContext(YamlApplyContext);
  if (!ctx) throw new Error('useYamlApply must be used within YamlApplyContextProvider');
  return ctx;
};

export const YamlApplyContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeMcp, setActiveMcpState] = useState<McpTarget | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const setActiveMcp = useCallback((target: McpTarget | null) => setActiveMcpState(target), []);
  const requestApplyFiles = useCallback((files: File[]) => setPendingFiles(files), []);
  const clearPendingFiles = useCallback(() => setPendingFiles([]), []);

  return (
    <YamlApplyContext.Provider value={{ activeMcp, setActiveMcp, pendingFiles, requestApplyFiles, clearPendingFiles }}>
      {children}
    </YamlApplyContext.Provider>
  );
};
