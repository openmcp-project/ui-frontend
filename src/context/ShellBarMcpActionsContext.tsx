import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { RoleBinding } from '../lib/api/types/crate/controlPlanes.ts';

export interface ShellBarMcpActionsContextType {
  kubeconfig: string | undefined;
  mcpName: string | undefined;
  namespace: string | undefined;
  roleBindings: RoleBinding[] | undefined;
  project: string | undefined;
  workspace: string | undefined;
  onEditMcp: (() => void) | undefined;
  onOpenYaml: (() => void) | undefined;
  navigateBack: (() => void) | undefined;
  setMcpActions: (
    kubeconfig: string | undefined,
    mcpName: string | undefined,
    roleBindings?: RoleBinding[],
    project?: string,
    workspace?: string,
    namespace?: string,
    onEditMcp?: () => void,
    navigateBack?: () => void,
    onOpenYaml?: () => void,
  ) => void;
  clearMcpActions: () => void;
}

const ShellBarMcpActionsContext = createContext<ShellBarMcpActionsContextType | null>(null);

export function ShellBarMcpActionsProvider({ children }: { children: ReactNode }) {
  const [kubeconfig, setKubeconfig] = useState<string | undefined>(undefined);
  const [mcpName, setMcpName] = useState<string | undefined>(undefined);
  const [namespace, setNamespace] = useState<string | undefined>(undefined);
  const [roleBindings, setRoleBindings] = useState<RoleBinding[] | undefined>(undefined);
  const [project, setProject] = useState<string | undefined>(undefined);
  const [workspace, setWorkspace] = useState<string | undefined>(undefined);
  const [onEditMcp, setOnEditMcp] = useState<(() => void) | undefined>(undefined);
  const [onOpenYaml, setOnOpenYaml] = useState<(() => void) | undefined>(undefined);
  const [navigateBack, setNavigateBack] = useState<(() => void) | undefined>(undefined);

  const setMcpActions = useCallback(
    (
      kc: string | undefined,
      name: string | undefined,
      rb?: RoleBinding[],
      proj?: string,
      ws?: string,
      ns?: string,
      editFn?: () => void,
      backFn?: () => void,
      yamlFn?: () => void,
    ) => {
      setKubeconfig(kc);
      setMcpName(name);
      setRoleBindings(rb);
      setProject(proj);
      setWorkspace(ws);
      setNamespace(ns);
      setOnEditMcp(editFn ? () => editFn : undefined);
      setNavigateBack(backFn ? () => backFn : undefined);
      setOnOpenYaml(yamlFn ? () => yamlFn : undefined);
    },
    [],
  );

  const clearMcpActions = useCallback(() => {
    setKubeconfig(undefined);
    setMcpName(undefined);
    setRoleBindings(undefined);
    setProject(undefined);
    setWorkspace(undefined);
    setNamespace(undefined);
    setOnEditMcp(undefined);
    setOnOpenYaml(undefined);
    setNavigateBack(undefined);
  }, []);

  return (
    <ShellBarMcpActionsContext.Provider
      value={{
        kubeconfig,
        mcpName,
        namespace,
        roleBindings,
        project,
        workspace,
        onEditMcp,
        onOpenYaml,
        navigateBack,
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
