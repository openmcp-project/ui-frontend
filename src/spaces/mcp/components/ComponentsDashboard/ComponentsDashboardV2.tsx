import { ComponentCard } from '../ComponentCard/ComponentCard.tsx';

import { Panel } from '@ui5/webcomponents-react';
import { useState } from 'react';
import LogoCrossplane from '../../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../../assets/images/logo-landscaper.svg';
import { CrossplaneInstallDialog } from '../CrossplaneInstallDialog/CrossplaneInstallDialog.tsx';

import { useTranslation } from 'react-i18next';
import type { McpPageSectionId } from '../../pages/McpPage.tsx';
import type { CrossplaneData } from '../../types/Crossplane.ts';
import type { EsoData } from '../../types/Eso.ts';
import type { FluxData } from '../../types/Flux.ts';
import type { LandscaperData } from '../../types/Landscaper.ts';
import styles from './ComponentsDashboard.module.css';

export interface ComponentsDashboardV2Props {
  onNavigateToMcpSection: (sectionId: McpPageSectionId) => void;
  crossplaneData: CrossplaneData | null;
  landscaperData: LandscaperData | null;
  fluxData: FluxData | null;
  esoData: EsoData | null;
  mcpName: string;
  mcpNamespace: string;
}

export function ComponentsDashboardV2({
  onNavigateToMcpSection,
  crossplaneData,
  landscaperData,
  fluxData,
  esoData,
  mcpName,
  mcpNamespace,
}: ComponentsDashboardV2Props) {
  const { t } = useTranslation();
  const [isCrossplaneDialogOpen, setIsCrossplaneDialogOpen] = useState(false);

  const isCrossplaneInstalled = !!crossplaneData?.version;
  const crossplaneVersion = crossplaneData?.version ?? undefined;

  const isLandscaperInstalled = !!landscaperData?.version;
  const landscaperVersion = landscaperData?.version ?? undefined;

  const isFluxInstalled = !!fluxData?.version;
  const fluxVersion = fluxData?.version ?? undefined;

  const isEsoInstalled = !!esoData?.version;
  const esoVersion = esoData?.version ?? undefined;

  return (
    <Panel fixed>
      <div className={styles['container']}>
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
