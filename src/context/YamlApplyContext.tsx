import { createContext, FC, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { ApiConfig } from '../lib/api/types/apiConfig';
import type { YamlUploadMethod } from '../lib/telemetry/features';

export type McpTarget = {
  name: string;
  apiConfig: ApiConfig;
};

type AppendHandler = (files: File[], method: YamlUploadMethod) => void;

interface YamlApplyContextValue {
  activeMcp: McpTarget | null;
  setActiveMcp: (target: McpTarget | null) => void;
  /** The files currently queued for the apply flow (from a drop or the Upload YAML button). */
  pendingFiles: File[];
  /** How the currently queued files were provided — drives the dialog's open-method telemetry. */
  pendingMethod: YamlUploadMethod;
  /** Programmatically start the apply flow for one or more files (e.g. from an "Upload YAML" button). */
  requestApplyFiles: (files: File[], method: YamlUploadMethod) => void;
  /** Clear the queued files (closes the apply dialog). */
  clearPendingFiles: () => void;
  /**
   * Lets the open dialog register a handler that appends files to its existing queue. While it is
   * registered, {@link requestApplyFiles} routes to it instead of replacing the queue, so a second
   * upload/drop never discards in-progress edits.
   */
  registerAppendHandler: (handler: AppendHandler | null) => void;
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
  const [pendingMethod, setPendingMethod] = useState<YamlUploadMethod>('file-picker');
  const appendHandlerRef = useRef<AppendHandler | null>(null);

  const setActiveMcp = useCallback((target: McpTarget | null) => setActiveMcpState(target), []);
  const requestApplyFiles = useCallback((files: File[], method: YamlUploadMethod) => {
    if (files.length === 0) return;
    // If the dialog is already open and can append, add to its queue instead of replacing it
    // (replacing would wipe the current queue and any in-progress edits).
    if (appendHandlerRef.current) {
      appendHandlerRef.current(files, method);
    } else {
      setPendingFiles(files);
      setPendingMethod(method);
    }
  }, []);
  const clearPendingFiles = useCallback(() => setPendingFiles([]), []);
  const registerAppendHandler = useCallback((handler: AppendHandler | null) => {
    appendHandlerRef.current = handler;
  }, []);

  return (
    <YamlApplyContext.Provider
      value={{
        activeMcp,
        setActiveMcp,
        pendingFiles,
        pendingMethod,
        requestApplyFiles,
        clearPendingFiles,
        registerAppendHandler,
      }}
    >
      {children}
    </YamlApplyContext.Provider>
  );
};
