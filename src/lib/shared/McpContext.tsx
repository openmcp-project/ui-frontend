import { BusyIndicator } from '@ui5/webcomponents-react';
import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';
import { ApiConfigProvider } from '../../components/Shared/k8s';
import { useAuthMcp } from '../../spaces/mcp/auth/AuthContextMcp.tsx';
import { useKubeconfigQuery } from '../../spaces/onboarding/hooks/useKubeconfigQuery.ts';
import { ControlPlane as ManagedControlPlaneResource, RoleBinding } from '../api/types/crate/controlPlanes.ts';
import { useApiResource } from '../api/useApiResource.ts';

interface Mcp {
  project: string;
  workspace: string;
  name: string;
  secretNamespace?: string;
  secretName?: string;
  secretKey?: string;
  kubeconfig?: string;
  roleBindings?: RoleBinding[];
  isNewControlPlane?: boolean;
}

interface McpContextProviderResult {
  loading: boolean;
  error: Error | string | null;
  ready: boolean;
}

interface Props {
  context: Mcp;
  children?: ReactNode;
  isNewControlPlane?: boolean;
  onState?: (state: McpContextProviderResult) => void;
}

export const McpContext = createContext({} as Mcp);

export const useMcp = () => {
  return useContext(McpContext);
};

export const McpContextProvider = ({ children, context, isNewControlPlane = false, onState }: Props) => {
  const mcp = useApiResource(
    ManagedControlPlaneResource(context.project, context.workspace, context.name, isNewControlPlane),
  );
  const secretNamespace = isNewControlPlane ? mcp.data?.metadata?.namespace : mcp.data?.status?.access?.namespace;
  const secretName = isNewControlPlane ? mcp.data?.status?.access?.oidc_openmcp?.name : mcp.data?.status?.access?.name;
  const secretKey = isNewControlPlane ? 'kubeconfig' : mcp.data?.status?.access?.key;

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
    isNewControlPlane,
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
        isNewControlPlane: mcp.isNewControlPlane,
      },
    }),
    [mcp.project, mcp.workspace, mcp.name, mcp.isNewControlPlane],
  );

  return (
    <>
      <ApiConfigProvider apiConfig={apiConfig}>{props.children}</ApiConfigProvider>
    </>
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
