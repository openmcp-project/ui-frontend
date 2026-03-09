import { useState, useEffect, useRef } from 'react';
import { useMcp } from '../../lib/shared/McpContext.tsx';
import { fetchApiServer } from '../../lib/api/fetch.ts';
import styles from './HeadlampIframe.module.css';

const HEADLAMP_BASE_URL = import.meta.env.VITE_HEADLAMP_URL ?? 'http://localhost:8080';

// ServiceAccount on the downstream cluster granted read access to Flux resources.
const HEADLAMP_SA_NAME = 'ekx';
const HEADLAMP_SA_NAMESPACE = 'default';
// Token lifetime: 8 hours
const TOKEN_EXPIRY_SECONDS = 28800;

interface HeadlampIframeProps {
  /** Headlamp path suffix after the cluster segment, e.g. 'flux/overview' */
  fluxPath?: string;
}

type RegistrationState = 'idle' | 'registering' | 'ready' | 'error';

/** Parse the `server:` value out of a kubeconfig YAML string (no yaml dep needed). */
function parseServerFromKubeconfig(kubeconfig: string): string {
  const match = kubeconfig.match(/^\s+server:\s*(\S+)/m);
  return match?.[1] ?? '';
}

/**
 * Embeds a Headlamp instance in kiosk mode pointed at the correct downstream cluster.
 *
 * On mount it:
 *  1. Generates a short-lived token for the `ekx` ServiceAccount via the MCP API proxy.
 *  2. Posts a kubeconfig (server URL from McpContext + SA token) to Headlamp's /cluster API.
 *  3. Renders the iframe once registration succeeds.
 *
 * ServiceAccount strategy:
 *  - Local / external Headlamp:  `ekx` SA on the downstream cluster, token generated here.
 *  - In-cluster (future):  UI and Headlamp share the same SA → Headlamp uses in-cluster
 *    token automatically. Set VITE_HEADLAMP_INCLUSTER=true to skip registration entirely.
 */
export function HeadlampIframe({ fluxPath = 'flux/overview' }: HeadlampIframeProps) {
  const { name: mcpName, project, workspace, kubeconfig } = useMcp();

  const [state, setState] = useState<RegistrationState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const registeredCluster = useRef<string | null>(null);

  const inClusterMode = import.meta.env.VITE_HEADLAMP_INCLUSTER === 'true';

  // In-cluster mode: Headlamp detects its own SA token — just point at the right path.
  const clusterName = inClusterMode ? 'main' : mcpName;
  const iframeSrc = `${HEADLAMP_BASE_URL}/c/${clusterName}/${fluxPath}`;

  useEffect(() => {
    if (inClusterMode) {
      setState('ready');
      return;
    }
    if (!mcpName || !project || !workspace || !kubeconfig) return;
    if (registeredCluster.current === clusterName) {
      setState('ready');
      return;
    }

    setState('registering');

    const register = async () => {
      try {
        // 1. Request a short-lived token for the Headlamp SA via the MCP API proxy.
        const tokenResp = await fetchApiServer(
          `/api/v1/namespaces/${HEADLAMP_SA_NAMESPACE}/serviceaccounts/${HEADLAMP_SA_NAME}/token`,
          {
            mcpConfig: { projectName: project, workspaceName: workspace, controlPlaneName: mcpName },
          },
          undefined,
          'POST',
          JSON.stringify({
            apiVersion: 'authentication.k8s.io/v1',
            kind: 'TokenRequest',
            spec: { expirationSeconds: TOKEN_EXPIRY_SECONDS },
          }),
        );
        const tokenData = (await tokenResp.json()) as { status?: { token?: string } };
        const token = tokenData?.status?.token;
        if (!token) throw new Error('TokenRequest returned no token');

        // 2. Extract the API server URL from the kubeconfig already in context.
        const server = parseServerFromKubeconfig(kubeconfig);
        if (!server) throw new Error('Could not parse server URL from kubeconfig');

        // 3. Build a minimal kubeconfig for Headlamp.
        //    insecure-skip-tls-verify avoids CA trust issues inside the Headlamp pod.
        const kubeconfigYaml = `apiVersion: v1
kind: Config
clusters:
- name: ${clusterName}
  cluster:
    insecure-skip-tls-verify: true
    server: ${server}
contexts:
- name: ${clusterName}
  context:
    cluster: ${clusterName}
    namespace: ${HEADLAMP_SA_NAMESPACE}
    user: ${HEADLAMP_SA_NAME}
current-context: ${clusterName}
users:
- name: ${HEADLAMP_SA_NAME}
  user:
    token: "${token}"
`;

        // 4. Register the cluster in Headlamp's dynamic cluster store via BFF proxy
        //    (direct fetch to HEADLAMP_BASE_URL would be blocked by CORS).
        const clusterResp = await fetch('/api/headlamp/cluster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kubeconfig: btoa(kubeconfigYaml) }),
        });
        if (!clusterResp.ok) {
          throw new Error(`Headlamp /cluster returned HTTP ${clusterResp.status}`);
        }

        registeredCluster.current = clusterName;
        setState('ready');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[HeadlampIframe] cluster registration failed:', msg);
        setErrorMsg(msg);
        setState('error');
      }
    };

    void register();
  }, [mcpName, project, workspace, kubeconfig, clusterName, inClusterMode]);

  if (state === 'idle' || state === 'registering') {
    return <div className={styles.placeholder}>Connecting to cluster…</div>;
  }

  if (state === 'error') {
    return <div className={styles.placeholder}>Failed to connect Headlamp to cluster: {errorMsg}</div>;
  }

  return <iframe src={iframeSrc} title="Headlamp" className={styles.iframe} />;
}
