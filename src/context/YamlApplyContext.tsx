import { createContext, FC, ReactNode, useCallback, useContext, useState } from 'react';
import { ApiConfig } from '../lib/api/types/apiConfig';

export type McpTarget = {
  name: string;
  apiConfig: ApiConfig;
};

interface YamlApplyContextValue {
  activeMcp: McpTarget | null;
  setActiveMcp: (target: McpTarget | null) => void;
}

const YamlApplyContext = createContext<YamlApplyContextValue | null>(null);

export const useYamlApply = (): YamlApplyContextValue => {
  const ctx = useContext(YamlApplyContext);
  if (!ctx) throw new Error('useYamlApply must be used within YamlApplyContextProvider');
  return ctx;
};

export const YamlApplyContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeMcp, setActiveMcpState] = useState<McpTarget | null>(null);
  const setActiveMcp = useCallback((target: McpTarget | null) => setActiveMcpState(target), []);

  return <YamlApplyContext.Provider value={{ activeMcp, setActiveMcp }}>{children}</YamlApplyContext.Provider>;
};
