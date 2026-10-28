import { createContext, FC, ReactNode, useCallback, useContext, useRef, useState } from 'react';
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
  /**
   * Lets the open dialog register a handler that appends files to its existing queue. While it is
   * registered, {@link requestApplyFiles} routes to it instead of replacing the queue, so a second
   * upload/drop never discards in-progress edits.
   */
  registerAppendHandler: (handler: ((files: File[]) => void) | null) => void;
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
  const appendHandlerRef = useRef<((files: File[]) => void) | null>(null);

  const setActiveMcp = useCallback((target: McpTarget | null) => setActiveMcpState(target), []);
  const requestApplyFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    // If the dialog is already open and can append, add to its queue instead of replacing it
    // (replacing would wipe the current queue and any in-progress edits).
    if (appendHandlerRef.current) {
      appendHandlerRef.current(files);
    } else {
      setPendingFiles(files);
    }
  }, []);
  const clearPendingFiles = useCallback(() => setPendingFiles([]), []);
  const registerAppendHandler = useCallback((handler: ((files: File[]) => void) | null) => {
    appendHandlerRef.current = handler;
  }, []);

  return (
    <YamlApplyContext.Provider
      value={{
        activeMcp,
        setActiveMcp,
        pendingFiles,
        requestApplyFiles,
        clearPendingFiles,
        registerAppendHandler,
      }}
    >
      {children}
    </YamlApplyContext.Provider>
  );
};
