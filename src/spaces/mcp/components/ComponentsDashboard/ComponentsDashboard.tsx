import { ComponentCard } from '../ComponentCard/ComponentCard.tsx';

import LogoCrossplane from '../../../../assets/images/logo-crossplane.svg';
import LogoFlux from '../../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../../assets/images/logo-landscaper.svg';
import LogoKyverno from '../../../../assets/images/logo-kyverno.png';
import LogoEso from '../../../../assets/images/logo-eso.svg';
import { McpPageSectionId } from '../../pages/McpPage.tsx';
import { ControlPlaneComponentsType } from '../../../../lib/api/types/crate/controlPlanes.ts';
import { useKpiCrossplane } from '../Kpi/useKpiCrossplane.ts';
import { useKpiFlux } from '../Kpi/useKpiFlux.ts';
import { Panel } from '@ui5/webcomponents-react';

import styles from './ComponentsDashboard.module.css';
import { useTranslation } from 'react-i18next';

export interface ComponentsDashboardProps {
  components?: ControlPlaneComponentsType;
  onInstallButtonClick: () => void;
  onNavigateToMcpSection: (sectionId: McpPageSectionId) => void;
}

export function ComponentsDashboard({
  components,
  onInstallButtonClick,
  onNavigateToMcpSection,
}: ComponentsDashboardProps) {
  const { t } = useTranslation();
  const crossplaneKpi = useKpiCrossplane();
  const fluxKpi = useKpiFlux();

  return (
    <Panel fixed>
      <div className={styles.container}>
        <ComponentCard
          name="Crossplane"
          description={t('componentCardCrossplane.description')}
          logoImgSrc={LogoCrossplane}
          isInstalled={!!components?.crossplane}
          version={components?.crossplane?.version}
          onNavigateToComponentSection={() => onNavigateToMcpSection('crossplane')}
          onInstallButtonClick={onInstallButtonClick}
          {...crossplaneKpi}
        />
        <ComponentCard
          name="Flux"
          description={t('componentCardFlux.description')}
          logoImgSrc={LogoFlux}
          isInstalled={!!components?.flux}
          version={components?.flux?.version}
          onNavigateToComponentSection={() => onNavigateToMcpSection('flux')}
          onInstallButtonClick={onInstallButtonClick}
          {...fluxKpi}
        />
        {/* not yet available
        <ComponentCard
          name="Vault"
          description={'Security and secrets management'}
          logoImgSrc={LogoVault}
          isInstalled={!!components?.vault}
          version={components?.vault?.version}
          kpiType="enabled"
          onNavigateToComponentSection={undefined}
          onInstallButtonClick={onInstallButtonClick}
        />*/}
        <ComponentCard
          name="Landscaper"
          description={t('componentCardLandscaper.description')}
          logoImgSrc={LogoLandscaper}
          isInstalled={!!components?.landscaper}
          version={undefined} // Landscaper does not have a version
          kpiType="enabled"
          onNavigateToComponentSection={() => onNavigateToMcpSection('landscapers')}
          onInstallButtonClick={undefined}
        />
        <ComponentCard
          name="Kyverno"
          description={t('componentCardKyverno.description')}
          logoImgSrc={LogoKyverno}
          isInstalled={!!components?.kyverno}
          version={components?.kyverno?.version}
          kpiType="enabled"
          onNavigateToComponentSection={undefined}
          onInstallButtonClick={onInstallButtonClick}
        />
        <ComponentCard
          name="External Secrets Operator"
          description={t('componentCardEso.description')}
          logoImgSrc={LogoEso}
          isInstalled={!!components?.externalSecretsOperator}
          version={components?.externalSecretsOperator?.version}
          kpiType="enabled"
          onNavigateToComponentSection={undefined}
          onInstallButtonClick={onInstallButtonClick}
        />
        {/* not yet available
        <ComponentCard
          name="Velero"
          description="Safely back up, restore, recover, and migrate Kubernetes resources"
          logoImgSrc={LogoVelero}
          isInstalled={!!components?.velero}
          version={components?.velero?.version}
          kpiType="enabled"
          onNavigateToComponentSection={undefined}
          onInstallButtonClick={onInstallButtonClick}
        />*/}
      </div>
    </Panel>
  );
}
