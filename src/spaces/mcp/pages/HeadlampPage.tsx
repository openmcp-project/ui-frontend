import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { McpContextProvider, WithinManagedControlPlane, useMcp } from '../../../lib/shared/McpContext.tsx';
import { registerKubeconfigWithBff } from './headlampKubeconfig.ts';
import styles from './HeadlampPage.module.css';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import { IllustratedBanner } from '../../../components/Ui/IllustratedBanner/IllustratedBanner.tsx';
import { useFrontendConfig } from '../../../context/FrontendConfigContext.tsx';
import { McpActions, useShellBarMcpActions } from '../../../context/ShellBarMcpActionsContext.tsx';
import { useControlPlaneV2Query } from '../../onboarding/hooks/controlPlaneV2/useControlPlaneV2Query.ts';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { ReadyStatus } from '../../onboarding/types/ControlPlane.ts';
import { flattenOidcRoleBindings, MemberRoleBinding } from '../../controlPlaneV2/helpers/flattenOidcRoleBindings.ts';

function HeadlampIframe({
  mcpCreationTimestamp,
  mcpCreatedBy,
  mcpStatus,
  mcpDisplayName,
  roleBindings,
}: {
  mcpCreationTimestamp?: string;
  mcpCreatedBy?: string;
  mcpStatus?: McpActions['mcpStatus'];
  mcpDisplayName?: string;
  roleBindings?: MemberRoleBinding[];
}) {
  const mcp = useMcp();
  const { t } = useTranslation();
  const { documentationBaseUrl } = useFrontendConfig();
  const { setMcpActions, clearMcpActions } = useShellBarMcpActions();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const clusterAlias = `${mcp.project}--${mcp.workspace}--${mcp.name}`;

  useEffect(() => {
    setMcpActions({
      kubeconfig: mcp.kubeconfig,
      mcpName: mcp.name,
      mcpDisplayName,
      roleBindings,
      project: mcp.project,
      workspace: mcp.workspace,
      mcpCreationTimestamp,
      mcpCreatedBy,
      mcpStatus,
    });
    return () => clearMcpActions();
  }, [
    mcp.kubeconfig,
    mcp.name,
    mcp.project,
    mcp.workspace,
    mcpDisplayName,
    roleBindings,
    mcpCreationTimestamp,
    mcpCreatedBy,
    mcpStatus,
    setMcpActions,
    clearMcpActions,
  ]);

  useEffect(() => {
    if (!mcp.kubeconfig) return;
    const controller = new AbortController();
    registerKubeconfigWithBff(mcp.kubeconfig, clusterAlias, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setIframeSrc(`/api/headlamp/c/${encodeURIComponent(clusterAlias)}`);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(true);
        else if (err instanceof Error && err.name !== 'AbortError') setError(true);
      });
    return () => {
      controller.abort();
      // Reset immediately on cleanup so the iframe never shows while the BFF session holds a different cluster's kubeconfig.
      setIframeSrc(null);
      setError(false);
    };
  }, [mcp.kubeconfig, clusterAlias]);

  if (error) {
    return (
      <div className={`${styles.wrapper} ${styles['wrapper--centered']}`}>
        <IllustratedBanner
          illustrationName={IllustrationMessageType.SimpleError}
          title={t('McpPage.headlampUnavailableTitle')}
          subtitle={t('McpPage.headlampUnavailableSubtitle')}
          help={{ link: `${documentationBaseUrl}/docs/help`, buttonText: t('McpPage.headlampGetSupport') }}
        />
      </div>
    );
  }

  if (!iframeSrc) return null;

  return (
    <div className={styles.wrapper}>
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        className={styles.iframe}
        title={`${t('McpPage.headlampTitle')} — ${mcp.name}`}
      />
    </div>
  );
}

export default function HeadlampPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  const namespace = projectName && workspaceName ? `project-${projectName}--ws-${workspaceName}` : undefined;
  const { data: mcp } = useControlPlaneV2Query(controlPlaneName, namespace);

  if (!projectName || !workspaceName || !controlPlaneName) return null;

  const mcpDisplayName = (mcp?.metadata?.annotations as Record<string, string> | undefined)?.[DISPLAY_NAME_ANNOTATION];
  const mcpCreatedBy = (mcp?.metadata?.annotations as Record<string, string> | undefined)?.['openmcp.cloud/created-by'];
  const mcpStatus = mcp?.metadata?.deletionTimestamp
    ? { status: ReadyStatus.InDeletion, conditions: mcp.status?.conditions ?? [] }
    : mcp?.status;
  const roleBindings = flattenOidcRoleBindings(mcp?.spec?.iam?.oidc);

  return (
    <McpContextProvider context={{ project: projectName, workspace: workspaceName, name: controlPlaneName }} isV2>
      <AuthProviderMcp>
        <WithinManagedControlPlane>
          <HeadlampIframe
            mcpCreationTimestamp={mcp?.metadata?.creationTimestamp}
            mcpCreatedBy={mcpCreatedBy}
            mcpStatus={mcpStatus}
            mcpDisplayName={mcpDisplayName}
            roleBindings={roleBindings}
          />
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
