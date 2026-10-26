import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { RoleBinding } from '../lib/api/types/crate/controlPlanes.ts';
import { ControlPlaneCondition } from '../spaces/onboarding/types/ControlPlane.ts';
import type { ServicePhases } from '../components/ControlPlane/controlPlaneHealth.ts';

export interface McpActions {
  kubeconfig?: string;
  mcpName?: string;
  mcpDisplayName?: string;
  roleBindings?: RoleBinding[];
  project?: string;
  workspace?: string;
  onEditMcp?: () => void;
  onOpenYaml?: () => void;
  navigateBack?: () => void;
  mcpCreationTimestamp?: string;
  mcpCreatedBy?: string;
  mcpStatus?: {
    status?: string | null;
    phase?: string | null;
    conditions?: ControlPlaneCondition[] | null;
  } | null;
  /** Set for `core.open-control-plane.io` ControlPlanes; switches the ShellBar to the aggregated status popover. */
  controlPlaneV2Status?: {
    phase?: string | null;
    conditions?: ControlPlaneCondition[] | null;
    deletionTimestamp?: string | null;
    services?: ServicePhases;
  };
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
