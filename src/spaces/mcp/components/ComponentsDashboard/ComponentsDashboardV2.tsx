import { ComponentCard } from '../ComponentCard/ComponentCard.tsx';

import { Panel } from '@ui5/webcomponents-react';
import LogoCrossplane from '../../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../../assets/images/logo-flux.svg';
import LogoKyverno from '../../../../assets/images/logo-kyverno.png';
import LogoLandscaper from '../../../../assets/images/logo-landscaper.svg';
import { ControlPlaneComponentsType } from '../../../../lib/api/types/crate/controlPlanes.ts';
import { useMcp } from '../../../../lib/shared/McpContext.tsx';
import { McpPageSectionId } from '../../pages/McpPage.tsx';
import { useCrossplaneQuery } from '../Kpi/useCrossplaneQuery.ts';
import { useEsoQuery } from '../Kpi/useEsoQuery.ts';
import { useFluxQuery } from '../Kpi/useFluxQuery.ts';
import { useLandscaperQuery } from '../Kpi/useLandscaperQuery.ts';
import { useKpiCrossplane } from '../Kpi/useKpiCrossplane.ts';
import { useKpiFlux } from '../Kpi/useKpiFlux.ts';

import { useTranslation } from 'react-i18next';
import styles from './ComponentsDashboard.module.css';

export interface ComponentsDashboardProps {
  components?: ControlPlaneComponentsType;
  onInstallButtonClick: () => void;
  onNavigateToMcpSection: (sectionId: McpPageSectionId) => void;
}

export function ComponentsDashboardV2({
  components,
  onInstallButtonClick,
  onNavigateToMcpSection,
}: ComponentsDashboardProps) {
  const { t } = useTranslation();
  const crossplaneKpi = useKpiCrossplane();
  const fluxKpi = useKpiFlux();
  const { name, project, workspace } = useMcp();
  const namespace = project && workspace ? `project-${project}--ws-${workspace}` : undefined;
  const { crossplaneData } = useCrossplaneQuery(name, namespace);
  const { landscaperData } = useLandscaperQuery(name, namespace);
  const { fluxData } = useFluxQuery(name, namespace);
  const { esoData } = useEsoQuery(name, namespace);

  // Use GraphQL query data if available, otherwise fall back to REST components spec
  const isCrossplaneInstalled = crossplaneData?.isInstalled ?? !!components?.crossplane;
  const crossplaneVersion = crossplaneData?.isInstalled
    ? (crossplaneData.providers?.[0]?.version ?? components?.crossplane?.version)
    : components?.crossplane?.version;

  const isLandscaperInstalled = landscaperData?.isInstalled ?? !!components?.landscaper;
  const landscaperVersion = landscaperData?.version ?? undefined;

  const isFluxInstalled = fluxData?.isInstalled ?? !!components?.flux;
  const fluxVersion = fluxData?.version ?? components?.flux?.version;

  const isEsoInstalled = esoData?.isInstalled ?? !!components?.externalSecretsOperator;
  const esoVersion = esoData?.version ?? components?.externalSecretsOperator?.version;

  return (
    <Panel fixed>
      <div className={styles.container}>
        <ComponentCard
          name="Crossplane"
          description={t('componentCardCrossplane.description')}
          logoImgSrc={LogoCrossplane}
          isInstalled={isCrossplaneInstalled}
          version={crossplaneVersion}
          onNavigateToComponentSection={() => onNavigateToMcpSection('crossplane')}
          onInstallButtonClick={onInstallButtonClick}
          {...crossplaneKpi}
        />
        <ComponentCard
          name="Flux"
          description={t('componentCardFlux.description')}
          logoImgSrc={LogoFlux}
          isInstalled={isFluxInstalled}
          version={fluxVersion}
          onNavigateToComponentSection={() => onNavigateToMcpSection('flux')}
          onInstallButtonClick={onInstallButtonClick}
          {...fluxKpi}
        />

        <ComponentCard
          name="Landscaper"
          description={t('componentCardLandscaper.description')}
          logoImgSrc={LogoLandscaper}
          isInstalled={isLandscaperInstalled}
          version={landscaperVersion}
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
          isInstalled={isEsoInstalled}
          version={esoVersion}
          kpiType="enabled"
          onNavigateToComponentSection={undefined}
          onInstallButtonClick={onInstallButtonClick}
        />
      </div>
    </Panel>
  );
}
