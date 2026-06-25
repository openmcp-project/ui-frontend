import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { IllustratedBanner } from '../../../components/Ui/IllustratedBanner/IllustratedBanner.tsx';
import { useFrontendConfig } from '../../../context/FrontendConfigContext.tsx';
import { McpContextProvider, WithinManagedControlPlane, useMcp } from '../../../lib/shared/McpContext.tsx';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { registerKubeconfigWithBff } from './headlampKubeconfig.ts';
import styles from './HeadlampPage.module.css';

function HeadlampIframe() {
  const mcp = useMcp();
  const { t } = useTranslation();
  const { documentationBaseUrl } = useFrontendConfig();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const clusterAlias = `${mcp.project}--${mcp.workspace}--${mcp.name}`;

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
      <IllustratedBanner
        illustrationName={IllustrationMessageType.SimpleError}
        title={t('McpPage.headlampUnavailableTitle')}
        subtitle={t('McpPage.headlampUnavailableSubtitle')}
        help={{ link: `${documentationBaseUrl}/docs/help`, buttonText: t('McpPage.headlampGetSupport') }}
      />
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

  if (!projectName || !workspaceName || !controlPlaneName) return null;

  return (
    <McpContextProvider
      context={{ project: projectName, workspace: workspaceName, name: controlPlaneName }}
      isNewControlPlane
    >
      <AuthProviderMcp>
        <WithinManagedControlPlane>
          <HeadlampIframe />
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
