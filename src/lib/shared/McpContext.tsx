import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ControlPlane as ManagedControlPlaneResource } from '../api/types/crate/controlPlanes.ts';
import { GetAuthPropsForContextName } from '../oidc/shared.ts';
import { AuthProvider, hasAuthParams, useAuth } from 'react-oidc-context';
import {
  ApiConfigContext,
  ApiConfigProvider,
} from '../../components/Shared/k8s';
import useResource from '../api/useApiResource.ts';
import { GetKubeconfig } from '../api/types/crate/getKubeconfig.ts';

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
  const auth = useAuth();
  const mcp = useContext(McpContext);
  const [hasTriedSignin, setHasTriedSignin] = useState(false);
  const parentApiConfig = useContext(ApiConfigContext);

  // automatically sign-in
  useEffect(() => {
    if (
      !hasAuthParams() &&
      !auth.isAuthenticated &&
      !auth.activeNavigator &&
      !auth.isLoading &&
      !hasTriedSignin
    ) {
      auth.signinPopup().then((_) => {
        setHasTriedSignin(true);
      });
    }
  }, [auth, hasTriedSignin]);

  if (!auth.isAuthenticated || auth.isLoading) {
    return <>Elevating your permissions</>;
  }
  return (
    <>
      <ApiConfigProvider
        apiConfig={{
          apiProxyUrl: parentApiConfig.apiProxyUrl,
          crateAuthorization: parentApiConfig.crateAuthorization,
          mcpConfig: {
            contextName: mcp.context,
            projectName: mcp.project,
            workspaceName: mcp.workspace,
            controlPlaneName: mcp.name,
            mcpAuthorization: auth.user?.access_token ?? '',
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
  const mcp = useContext(McpContext);

  const authprops = GetAuthPropsForContextName(mcp.context, mcp.kubeconfig!);
  return (
    <>
      <AuthProvider key={mcp.context} {...authprops}>
        <RequireDownstreamLogin>{children}</RequireDownstreamLogin>
      </AuthProvider>
    </>
  );
}
