import { BusyIndicator } from '@ui5/webcomponents-react';
import { createContext, ReactNode, useContext } from 'react';
import { ApiConfigProvider } from '../../components/Shared/k8s';
import { useAuthMcp } from '../../spaces/mcp/auth/AuthContextMcp.tsx';
import { useGetKubeconfig } from '../../spaces/onboarding/services/GetKubeconfigService/GetKubeconfigService.ts';
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
}

interface Props {
  context: Mcp;
  children?: ReactNode;
  isV2?: boolean;
}

export const McpContext = createContext({} as Mcp);

export const useMcp = () => {
  return useContext(McpContext);
};

export const McpContextProvider = ({ children, context, isV2 = false }: Props) => {
  const mcp = useApiResource(ManagedControlPlaneResource(context.project, context.workspace, context.name, isV2));
  const secretNamespace = isV2 ? mcp.data?.metadata?.namespace : mcp.data?.status?.access?.namespace;
  const secretName = isV2 ? mcp.data?.status?.access?.oidc_openmcp?.name : mcp.data?.status?.access?.name;
  const secretKey = isV2 ? 'kubeconfig' : mcp.data?.status?.access?.key;

  const kubeconfigQuery = useGetKubeconfig(secretName, secretNamespace);
  const kubeconfigBase64 = kubeconfigQuery.data?.[secretKey ?? ''];
  const kubeconfigDecoded = kubeconfigBase64 ? atob(kubeconfigBase64) : undefined;

  if (mcp.isLoading || mcp.error) {
    return <></>;
  }
  if (kubeconfigQuery.isPending || kubeconfigQuery.error) {
    return <></>;
  }
  context.kubeconfig = kubeconfigDecoded;
  context.roleBindings = mcp.data?.spec?.authorization?.roleBindings;
  return <McpContext.Provider value={context}>{children}</McpContext.Provider>;
};

function RequireDownstreamLogin(props: { children?: ReactNode }) {
  const mcp = useContext(McpContext);

  return (
    <>
      <ApiConfigProvider
        apiConfig={{
          mcpConfig: {
            projectName: mcp.project,
            workspaceName: mcp.workspace,
            controlPlaneName: mcp.name,
          },
        }}
      >
        {props.children}
      </ApiConfigProvider>
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
