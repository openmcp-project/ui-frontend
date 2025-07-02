import { createContext, ReactNode, useContext } from 'react';
import { ControlPlane as ManagedControlPlaneResource } from '../api/types/crate/controlPlanes.ts';
import { ApiConfigProvider } from '../../components/Shared/k8s';
import useResource from '../api/useApiResource.ts';
import { GetKubeconfig } from '../api/types/crate/getKubeconfig.ts';
import { useAuthMcp } from '../../spaces/mcp/auth/AuthContextMcp.tsx';
import { BusyIndicator } from '@ui5/webcomponents-react';

interface McpContext {
  project: string;
  workspace: string;
  name: string;
  context: string;

  secretNamespace?: string;
  secretName?: string;
  secretKey?: string;
  kubeconfig?: string;
}

interface Props {
  context: McpContext;
  children?: ReactNode;
}

export const McpContext = createContext({} as McpContext);

export const useMcp = () => {
  return useContext(McpContext);
};

export const McpContextProvider = ({ children, context }: Props) => {
  const mcp = useResource(
    ManagedControlPlaneResource(
      context.project,
      context.workspace,
      context.name,
    ),
  );

  const secretNamespace = mcp.data?.status?.access?.namespace;
  const secretName = mcp.data?.status?.access?.name;
  const secretKey = mcp.data?.status?.access?.key;

  const kubeconfig = useResource(
    GetKubeconfig(secretKey ?? '', secretName ?? '', secretNamespace ?? ''),
  );

  if (mcp.isLoading || mcp.error) {
    return <></>;
  }
  if (kubeconfig.isLoading || kubeconfig.error) {
    return <></>;
  }
  context.kubeconfig = kubeconfig.data;
  return <McpContext.Provider value={context}>{children}</McpContext.Provider>;
};

function RequireDownstreamLogin(props: { children?: ReactNode }) {
  const mcp = useContext(McpContext);

  return (
    <>
      <ApiConfigProvider
        apiConfig={{
          mcpConfig: {
            contextName: mcp.context,
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

export function WithinManagedControlPlane({
  children,
}: {
  children?: ReactNode;
}) {
  const auth = useAuthMcp();

  if (auth.isLoading) {
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
