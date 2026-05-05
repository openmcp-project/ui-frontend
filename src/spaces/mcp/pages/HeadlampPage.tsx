import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthProviderMcp } from '../auth/AuthContextMcp.tsx';
import { McpContextProvider, WithinManagedControlPlane, useMcp } from '../../../lib/shared/McpContext.tsx';
import { registerKubeconfigWithBff } from './headlampKubeconfig.ts';
import styles from './HeadlampPage.module.css';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import { IllustratedBanner } from '../../../components/Ui/IllustratedBanner/IllustratedBanner.tsx';
import { useFrontendConfig } from '../../../context/FrontendConfigContext.tsx';

function HeadlampIframe() {
  const mcp = useMcp();
  const { documentationBaseUrl } = useFrontendConfig();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const clusterAlias = `${mcp.project}--${mcp.workspace}--${mcp.name}`;

  useEffect(() => {
    if (!mcp.kubeconfig) return;
    registerKubeconfigWithBff(mcp.kubeconfig, clusterAlias)
      .then(() => setIframeSrc(`/api/headlamp/c/${clusterAlias}/flux/overview`))
      .catch(() => setError(true));
  }, [mcp.kubeconfig, clusterAlias]);

  if (error) {
    return (
      <IllustratedBanner
        illustrationName={IllustrationMessageType.SimpleError}
        title="Headlamp unavailable"
        subtitle="The Headlamp service could not be reached. Please check that it is deployed and healthy."
        help={{ link: `${documentationBaseUrl}/docs/help`, buttonText: 'Get support' }}
      />
    );
  }

  if (!iframeSrc) return null;

  return (
    <div className={styles.wrapper}>
      <iframe key={iframeSrc} src={iframeSrc} className={styles.iframe} title={`Headlamp — ${mcp.name}`} />
    </div>
  );
}

export default function HeadlampPage() {
  const { projectName, workspaceName, controlPlaneName } = useParams();

  if (!projectName || !workspaceName || !controlPlaneName) return null;

  return (
    <McpContextProvider context={{ project: projectName, workspace: workspaceName, name: controlPlaneName }} isV2>
      <AuthProviderMcp>
        <WithinManagedControlPlane>
          <HeadlampIframe />
        </WithinManagedControlPlane>
      </AuthProviderMcp>
    </McpContextProvider>
  );
}
