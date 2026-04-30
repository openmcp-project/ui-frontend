/**
 * HeadlampPage
 *
 * Embeds the central Headlamp instance in a full-height iframe.
 * All Headlamp traffic is proxied through the BFF at /api/headlamp/*,
 * which injects the user's session token on every request server-side.
 *
 * The kubeconfig is registered with the BFF via POST /api/headlamp-kubeconfig.
 * The BFF then forwards it as the KUBECONFIG header on every proxied request,
 * enabling Headlamp's per-request stateless cluster mode.
 * No credentials are ever exposed to the browser.
 *
 * Route: /mcp/projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName/headlamp
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { McpContextProvider, WithinManagedControlPlane, useMcp } from '../../../lib/shared/McpContext.tsx';
import { registerKubeconfigWithBff } from './headlampKubeconfig.ts';
import styles from './HeadlampPage.module.css';

function HeadlampIframe() {
  const mcp = useMcp();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const clusterAlias = `${mcp.project}--${mcp.workspace}--${mcp.name}`;

  useEffect(() => {
    if (!mcp.kubeconfig) return;
    registerKubeconfigWithBff(mcp.kubeconfig, clusterAlias).then(() => {
      setIframeSrc(`/api/headlamp/c/${clusterAlias}/flux/overview`);
    });
  }, [mcp.kubeconfig, clusterAlias]);

  if (!iframeSrc) return null;

  return (
    <div className={styles.wrapper}>
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        className={styles.iframe}
        title={`Headlamp — ${mcp.name}`}
      />
    </div>
  );
}

export default function HeadlampPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();

  if (!projectName || !workspaceName || !controlPlaneName) {
    return null;
  }

  return (
    <McpContextProvider
      context={{
        project: projectName,
        workspace: workspaceName,
        name: controlPlaneName,
      }}
      isV2
    >
      <AuthProviderMcp>
        <WithinManagedControlPlane>
          <HeadlampIframe />
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
