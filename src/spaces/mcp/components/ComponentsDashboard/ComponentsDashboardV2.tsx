import { ComponentCard } from '../ComponentCard/ComponentCard.tsx';

import { Panel } from '@ui5/webcomponents-react';
import { useState } from 'react';
import LogoCrossplane from '../../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../../assets/images/logo-landscaper.svg';
import { CrossplaneInstallDialog } from '../CrossplaneInstallDialog/CrossplaneInstallDialog.tsx';
import type { UseCrossplaneQueryResult } from '../Kpi/useCrossplaneQuery.ts';
import type { UseEsoQueryResult } from '../Kpi/useEsoQuery.ts';
import type { UseFluxQueryResult } from '../Kpi/useFluxQuery.ts';
import type { UseLandscaperQueryResult } from '../Kpi/useLandscaperQuery.ts';

import { useTranslation } from 'react-i18next';
import type { McpPageSectionId } from '../../pages/McpPage.tsx';
import styles from './ComponentsDashboard.module.css';

export interface ComponentsDashboardV2Props {
  onNavigateToMcpSection: (sectionId: McpPageSectionId) => void;
  crossplaneData: UseCrossplaneQueryResult['crossplaneData'];
  landscaperData: UseLandscaperQueryResult['landscaperData'];
  fluxData: UseFluxQueryResult['fluxData'];
  esoData: UseEsoQueryResult['esoData'];
  hasQueryError?: boolean;
  mcpName: string;
  mcpNamespace: string;
}

export function ComponentsDashboardV2({
  onNavigateToMcpSection,
  crossplaneData,
  landscaperData,
  fluxData,
  esoData,
  hasQueryError,
  mcpName,
  mcpNamespace,
}: ComponentsDashboardV2Props) {
  const { t } = useTranslation();
  const [isCrossplaneDialogOpen, setIsCrossplaneDialogOpen] = useState(false);

  const isCrossplaneInstalled = !!crossplaneData?.isInstalled;
  const crossplaneVersion = crossplaneData?.version ?? '';

  const isLandscaperInstalled = !!landscaperData?.isInstalled;
  const landscaperVersion = landscaperData?.version ?? '';

  const isFluxInstalled = !!fluxData?.isInstalled;
  const fluxVersion = fluxData?.version ?? '';

  const isEsoInstalled = !!esoData?.isInstalled;
  const esoVersion = esoData?.version ?? '';

  return (
    <Panel fixed>
      <div className={styles['container-v2']}>
        <ComponentCard
          isV2
          name="Crossplane"
          description={t('componentCardCrossplane.description')}
          logoImgSrc={LogoCrossplane}
          kpiType="enabled"
          isInstalled={isCrossplaneInstalled}
          version={crossplaneVersion}
          onNavigateToComponentSection={() => onNavigateToMcpSection('crossplane')}
          onInstallButtonClick={!isCrossplaneInstalled ? () => setIsCrossplaneDialogOpen(true) : undefined}
        />
        <ComponentCard
          isV2
          name="Flux"
          description={t('componentCardFlux.description')}
          logoImgSrc={LogoFlux}
          kpiType="enabled"
          isInstalled={isFluxInstalled}
          version={fluxVersion}
          onNavigateToComponentSection={() => onNavigateToMcpSection('flux')}
        />
        <ComponentCard
          isV2
          name="Landscaper"
          description={t('componentCardLandscaper.description')}
          logoImgSrc={LogoLandscaper}
          isInstalled={isLandscaperInstalled}
          version={landscaperVersion}
          kpiType="enabled"
          onNavigateToComponentSection={() => onNavigateToMcpSection('landscapers')}
        />
        <ComponentCard
          isV2
          name="External Secrets Operator"
          description={t('componentCardEso.description')}
          logoImgSrc={LogoEso}
          isInstalled={isEsoInstalled}
          version={esoVersion}
          kpiType="enabled"
          onNavigateToComponentSection={undefined}
        />
      </div>
      <CrossplaneInstallDialog
        open={isCrossplaneDialogOpen}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        onClose={() => setIsCrossplaneDialogOpen(false)}
      />
    </Panel>
  );
}
