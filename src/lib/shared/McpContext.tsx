import { BusyIndicator } from '@ui5/webcomponents-react';
import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';
import { SWRConfig } from 'swr';
import { ApiConfigProvider } from '../../components/Shared/k8s';
import { useAuthMcp } from '../../spaces/mcp/auth/AuthContextMcp.tsx';
import { useKubeconfigQuery } from '../../spaces/onboarding/hooks/useKubeconfigQuery.ts';
import { ControlPlane as ManagedControlPlaneResource, RoleBinding } from '../api/types/crate/controlPlanes.ts';
import { useApiResource } from '../api/useApiResource.ts';
import { createPersistentProvider } from '../swr/persistentProvider.ts';

interface Mcp {
  project: string;
  workspace: string;
  name: string;
  secretNamespace?: string;
  secretName?: string;
  secretKey?: string;
  kubeconfig?: string;
  roleBindings?: RoleBinding[];
  isV2?: boolean;
}

interface McpContextProviderResult {
  loading: boolean;
  error: Error | string | null;
  ready: boolean;
}

interface Props {
  context: Mcp;
  children?: ReactNode;
  isV2?: boolean;
  onState?: (state: McpContextProviderResult) => void;
}

export const McpContext = createContext({} as Mcp);

export const useMcp = () => {
  return useContext(McpContext);
};

export const McpContextProvider = ({ children, context, isV2 = false, onState }: Props) => {
  const mcp = useApiResource(ManagedControlPlaneResource(context.project, context.workspace, context.name, isV2));
  const secretNamespace = isV2 ? mcp.data?.metadata?.namespace : mcp.data?.status?.access?.namespace;
  const secretName = isV2 ? mcp.data?.status?.access?.oidc_openmcp?.name : mcp.data?.status?.access?.name;
  const secretKey = isV2 ? 'kubeconfig' : mcp.data?.status?.access?.key;

  const kubeconfigQuery = useKubeconfigQuery(secretName, secretNamespace, secretKey);

  const loading = mcp.isLoading || kubeconfigQuery.isPending;
  const error: Error | string | null = useMemo(
    () =>
      mcp.error ??
      kubeconfigQuery.error ??
      (!secretKey && !loading ? new Error('Control plane has no kubeconfig access information yet') : null),
    [mcp.error, kubeconfigQuery.error, secretKey, loading],
  );
  const ready = !loading && !error && !!secretKey;

  useEffect(() => {
    onState?.({ loading, error, ready });
  }, [loading, error, ready, onState]);

  if (loading) {
    return <></>;
  }

  if (error) {
    return <></>;
  }

  if (!secretKey) {
    return <></>;
  }

  const enrichedContext: Mcp = {
    ...context,
    isV2,
    kubeconfig: kubeconfigQuery.kubeconfigDecoded,
    roleBindings: mcp.data?.spec?.authorization?.roleBindings,
  };
  return <McpContext.Provider value={enrichedContext}>{children}</McpContext.Provider>;
};

function RequireDownstreamLogin(props: { children?: ReactNode }) {
  const mcp = useContext(McpContext);

  const apiConfig = useMemo(
    () => ({
      mcpConfig: {
        projectName: mcp.project,
        workspaceName: mcp.workspace,
        controlPlaneName: mcp.name,
        isV2: mcp.isV2,
      },
    }),
    [mcp.project, mcp.workspace, mcp.name, mcp.isV2],
  );

  // Per-MCP SWR provider: hydrates cached entries (CRDs, providerconfigs, …)
  // from localStorage on mount so the page paints instantly on reload.
  const mcpId = `${mcp.project}:${mcp.workspace}:${mcp.name}`;
  const provider = useMemo(() => createPersistentProvider(mcpId), [mcpId]);

  return (
    <SWRConfig value={{ provider }}>
      <ApiConfigProvider apiConfig={apiConfig}>{props.children}</ApiConfigProvider>
    </SWRConfig>
  );
}

export function WithinManagedControlPlane({ children }: { children?: ReactNode }) {
  const auth = useAuthMcp();

  if (auth.isPending) {
    return <BusyIndicator active />;
  }

  if (!auth.isAuthenticated) {
    auth.login();
    return null;
  }

  return (
    <>
      <RequireDownstreamLogin>{children}</RequireDownstreamLogin>
    </>
  );
}
