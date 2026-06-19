import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { RoleBinding } from '../lib/api/types/crate/controlPlanes.ts';

export interface McpActions {
  kubeconfig?: string;
  mcpName?: string;
  mcpDisplayName?: string;
  namespace?: string;
  roleBindings?: RoleBinding[];
  project?: string;
  workspace?: string;
  onEditMcp?: () => void;
  onOpenYaml?: () => void;
  navigateBack?: () => void;
}

export interface ShellBarMcpActionsContextType extends McpActions {
  setMcpActions: (actions: McpActions) => void;
  clearMcpActions: () => void;
}

const ShellBarMcpActionsContext = createContext<ShellBarMcpActionsContextType | null>(null);

export function ShellBarMcpActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<McpActions>({});

  const setMcpActions = useCallback((next: McpActions) => {
    setActions({
      ...next,
      onEditMcp: next.onEditMcp ? () => next.onEditMcp!() : undefined,
      onOpenYaml: next.onOpenYaml ? () => next.onOpenYaml!() : undefined,
      navigateBack: next.navigateBack ? () => next.navigateBack!() : undefined,
    });
  }, []);

  const clearMcpActions = useCallback(() => {
    setActions({});
  }, []);

  return (
    <ShellBarMcpActionsContext.Provider
      value={{
        ...actions,
        setMcpActions,
        clearMcpActions,
      }}
    >
      {children}
    </ShellBarMcpActionsContext.Provider>
  );
}

export function useShellBarMcpActions() {
  const ctx = useContext(ShellBarMcpActionsContext);
  if (!ctx) throw new Error('useShellBarMcpActions must be used within a ShellBarMcpActionsProvider');
  return ctx;
}
