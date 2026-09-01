import { BusyIndicator } from '@ui5/webcomponents-react';
import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  idp?: string;
}

interface McpContextProviderResult {
  loading: boolean;
  error: Error | string | null;
  ready: boolean;
}

type AccessMap = Record<string, { name?: string } | undefined>;

interface Props {
  context: Mcp;
  children?: ReactNode;
  isV2?: boolean;
  onState?: (state: McpContextProviderResult) => void;
  /** V2 only: pass access + namespace already fetched by the page to skip the duplicate REST fetch. */
  preloadedAccess?: AccessMap | null;
  preloadedNamespace?: string;
}

export const McpContext = createContext({} as Mcp);

export const useMcp = () => {
  return useContext(McpContext);
};

export const McpContextProvider = ({
  children,
  context,
  isV2 = false,
  onState,
  preloadedAccess,
  preloadedNamespace,
}: Props) => {
  const [searchParams] = useSearchParams();
  const idpName = searchParams.get('idp');

  const skipRestFetch = isV2 && preloadedAccess !== undefined;
  const mcp = useApiResource(
    ManagedControlPlaneResource(context.project, context.workspace, context.name, isV2),
    undefined,
    undefined,
    skipRestFetch,
  );

  // V2 exposes one access entry per IdP, keyed `oidc_<providerName>`. The system IdP is
  // `oidc_openmcp` (used when no `idp` query param is present); a custom IdP is `oidc_<idp>`.
  const accessKey: `oidc_${string}` = idpName ? `oidc_${idpName}` : 'oidc_openmcp';
  const accessSource: AccessMap | null | undefined = skipRestFetch
    ? preloadedAccess
    : (mcp.data?.status?.access as AccessMap | null | undefined);
  const secretNamespace = isV2
    ? (preloadedNamespace ?? mcp.data?.metadata?.namespace)
    : mcp.data?.status?.access?.namespace;
  const secretName = isV2 ? accessSource?.[accessKey]?.name : mcp.data?.status?.access?.name;
  const secretKey = isV2 ? 'kubeconfig' : mcp.data?.status?.access?.key;

  const kubeconfigQuery = useKubeconfigQuery(secretName, secretNamespace, secretKey);

  // Both the secret name and key are required to load a kubeconfig. In V2 `secretKey` is a
  // constant, so `secretName` is the meaningful signal for whether the chosen IdP has access.
  const hasAccessInfo = !!secretName && !!secretKey;

  const loading = (skipRestFetch ? false : mcp.isLoading) || kubeconfigQuery.isPending;
  const error: Error | string | null = useMemo(
    () =>
      (skipRestFetch ? null : mcp.error) ??
      kubeconfigQuery.error ??
      (!hasAccessInfo && !loading ? new Error('Control plane has no kubeconfig access information yet') : null),
    [skipRestFetch, mcp.error, kubeconfigQuery.error, hasAccessInfo, loading],
  );
  const ready = !loading && !error && hasAccessInfo;

  useEffect(() => {
    onState?.({ loading, error, ready });
  }, [loading, error, ready, onState]);

  // When access data is preloaded (V2 page), render children immediately so that
  // components that don't depend on McpContext (e.g. ComponentsDashboardV2) are
  // not blocked by the kubeconfig fetch. WithinManagedControlPlane gates on
  // mcp.kubeconfig itself before providing the downstream ApiConfigProvider.
  if (skipRestFetch) {
    const enrichedContext: Mcp = {
      ...context,
      isV2,
      idp: idpName ?? undefined,
      kubeconfig: kubeconfigQuery.kubeconfigDecoded,
      roleBindings: mcp.data?.spec?.authorization?.roleBindings,
    };
    return <McpContext.Provider value={enrichedContext}>{children}</McpContext.Provider>;
  }

  if (loading) {
    return <></>;
  }

  if (error) {
    return <></>;
  }

  if (!hasAccessInfo) {
    return <></>;
  }

  const enrichedContext: Mcp = {
    ...context,
    isV2,
    idp: idpName ?? undefined,
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
        idp: mcp.idp,
      },
    }),
    [mcp.project, mcp.workspace, mcp.name, mcp.isV2, mcp.idp],
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
