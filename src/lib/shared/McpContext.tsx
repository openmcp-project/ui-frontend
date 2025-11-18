import { createContext, ReactNode, useContext } from 'react';
import { ControlPlane as ManagedControlPlaneResource, RoleBinding } from '../api/types/crate/controlPlanes.ts';
import { ApiConfigProvider } from '../../components/Shared/k8s';
import { useApiResource } from '../api/useApiResource.ts';
import { GetKubeconfig } from '../api/types/crate/getKubeconfig.ts';
import { useAuthMcp } from '../../spaces/mcp/auth/AuthContextMcp.tsx';
import { BusyIndicator } from '@ui5/webcomponents-react';
import { useGetMcpUserRights } from '../../spaces/mcp/authorization/useGetMcpUserRights.ts';

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
}

export const McpContext = createContext({} as Mcp);

export const useMcp = () => {
  return useContext(McpContext);
};

export const McpContextProvider = ({ children, context }: Props) => {
  const mcp = useApiResource(ManagedControlPlaneResource(context.project, context.workspace, context.name));

  const secretNamespace = mcp.data?.status?.access?.namespace;
  const secretName = mcp.data?.status?.access?.name;
  const secretKey = mcp.data?.status?.access?.key;

  const kubeconfig = useApiResource(GetKubeconfig(secretKey ?? '', secretName ?? '', secretNamespace ?? ''));

  if (mcp.isLoading || mcp.error) {
    return <></>;
  }
  if (kubeconfig.isLoading || kubeconfig.error) {
    return <></>;
  }
  context.kubeconfig = kubeconfig.data;
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
  const { isMcpAdmin } = useGetMcpUserRights();
  console.log('isMcpAdmin');
  console.log(isMcpAdmin);
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
