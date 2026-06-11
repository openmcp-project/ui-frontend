import { BusyIndicator } from '@ui5/webcomponents-react';
import { createContext, ReactNode, useContext, useMemo } from 'react';
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

  if (mcp.isLoading || kubeconfigQuery.isPending) {
    onState?.({ loading: true, error: null, ready: false });
    return <></>;
  }

  if (mcp.error) {
    onState?.({ loading: false, error: mcp.error, ready: false });
    return <></>;
  }

  if (kubeconfigQuery.error) {
    onState?.({ loading: false, error: kubeconfigQuery.error, ready: false });
    return <></>;
  }

  if (!secretKey) {
    onState?.({
      loading: false,
      error: new Error('Control plane has no kubeconfig access information yet'),
      ready: false,
    });
    return <></>;
  }

  const enrichedContext: Mcp = {
    ...context,
    isV2,
    kubeconfig: kubeconfigQuery.kubeconfigDecoded,
    roleBindings: mcp.data?.spec?.authorization?.roleBindings,
  };
  onState?.({ loading: false, error: null, ready: true });
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
