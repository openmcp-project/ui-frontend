/**
 * HeadlampPage
 *
 * Embeds the central Headlamp instance in a full-height iframe.
 * All Headlamp traffic is proxied through the BFF at /api/headlamp/*,
 * which injects the user's session token on every request server-side.
 * No credentials are ever exposed to the browser.
 *
 * Route: /mcp/projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName/headlamp
 */

import { useParams } from 'react-router-dom';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { McpContextProvider, WithinManagedControlPlane, useMcp } from '../../../lib/shared/McpContext.tsx';
import styles from './HeadlampPage.module.css';

function HeadlampIframe() {
  const mcp = useMcp();
  return (
    <div className={styles.wrapper}>
      <iframe
        src="/api/headlamp/"
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
