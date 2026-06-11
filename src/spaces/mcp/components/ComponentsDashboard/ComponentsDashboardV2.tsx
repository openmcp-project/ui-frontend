import { ComponentCard } from '../ComponentCard/ComponentCard.tsx';

import { Panel } from '@ui5/webcomponents-react';
import { useState } from 'react';
import LogoCrossplane from '../../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../../assets/images/logo-landscaper.svg';
import { useCreateEso } from '../../hooks/useCreateEso.ts';
import { useCreateFlux } from '../../hooks/useCreateFlux.ts';
import { useCreateLandscaper } from '../../hooks/useCreateLandscaper.ts';
import { useUpdateEso } from '../../hooks/useUpdateEso.ts';
import { useUpdateFlux } from '../../hooks/useUpdateFlux.ts';
import { useUpdateLandscaper } from '../../hooks/useUpdateLandscaper.ts';
import { CrossplaneInstallDialog } from '../CrossplaneInstallDialog/CrossplaneInstallDialog.tsx';

import { useTranslation } from 'react-i18next';
import type { McpPageSectionId } from '../../pages/McpPage.tsx';
import type { CrossplaneData } from '../../types/Crossplane.ts';
import type { EsoData } from '../../types/Eso.ts';
import type { FluxData } from '../../types/Flux.ts';
import type { LandscaperData } from '../../types/Landscaper.ts';
import { ComponentInstallDialog } from '../ComponentInstallDialog/ComponentInstallDialog.tsx';
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
  const [crossplaneDialogMode, setCrossplaneDialogMode] = useState<'install' | 'edit'>('install');

  const [isFluxDialogOpen, setIsFluxDialogOpen] = useState(false);
  const [fluxDialogMode, setFluxDialogMode] = useState<'install' | 'edit'>('install');

  const [isLandscaperDialogOpen, setIsLandscaperDialogOpen] = useState(false);
  const [landscaperDialogMode, setLandscaperDialogMode] = useState<'install' | 'edit'>('install');

  const [isEsoDialogOpen, setIsEsoDialogOpen] = useState(false);
  const [esoDialogMode, setEsoDialogMode] = useState<'install' | 'edit'>('install');

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
          name="Crossplane"
          description={t('componentCardCrossplane.description')}
          logoImgSrc={LogoCrossplane}
          kpiType="enabled"
          isInstalled={isCrossplaneInstalled}
          version={crossplaneVersion}
          onNavigateToComponentSection={() => onNavigateToMcpSection('crossplane')}
          onInstallButtonClick={
            !isCrossplaneInstalled
              ? () => {
                  setCrossplaneDialogMode('install');
                  setIsCrossplaneDialogOpen(true);
                }
              : undefined
          }
          onEditButtonClick={
            isCrossplaneInstalled
              ? () => {
                  setCrossplaneDialogMode('edit');
                  setIsCrossplaneDialogOpen(true);
                }
              : undefined
          }
        />
        <ComponentCard
          name="Flux"
          description={t('componentCardFlux.description')}
          logoImgSrc={LogoFlux}
          kpiType="enabled"
          isInstalled={isFluxInstalled}
          version={fluxVersion}
          onNavigateToComponentSection={() => onNavigateToMcpSection('flux')}
          onInstallButtonClick={
            !isFluxInstalled
              ? () => {
                  setFluxDialogMode('install');
                  setIsFluxDialogOpen(true);
                }
              : undefined
          }
          onEditButtonClick={
            isFluxInstalled
              ? () => {
                  setFluxDialogMode('edit');
                  setIsFluxDialogOpen(true);
                }
              : undefined
          }
        />
        <ComponentCard
          name="Landscaper"
          description={t('componentCardLandscaper.description')}
          logoImgSrc={LogoLandscaper}
          isInstalled={isLandscaperInstalled}
          version={landscaperVersion}
          kpiType="enabled"
          onNavigateToComponentSection={() => onNavigateToMcpSection('landscaper')}
          onInstallButtonClick={
            !isLandscaperInstalled
              ? () => {
                  setLandscaperDialogMode('install');
                  setIsLandscaperDialogOpen(true);
                }
              : undefined
          }
          onEditButtonClick={
            isLandscaperInstalled
              ? () => {
                  setLandscaperDialogMode('edit');
                  setIsLandscaperDialogOpen(true);
                }
              : undefined
          }
        />
        <ComponentCard
          name="External Secrets Operator"
          description={t('componentCardEso.description')}
          logoImgSrc={LogoEso}
          isInstalled={isEsoInstalled}
          version={esoVersion}
          kpiType="enabled"
          onNavigateToComponentSection={undefined}
          onInstallButtonClick={
            !isEsoInstalled
              ? () => {
                  setEsoDialogMode('install');
                  setIsEsoDialogOpen(true);
                }
              : undefined
          }
          onEditButtonClick={
            isEsoInstalled
              ? () => {
                  setEsoDialogMode('edit');
                  setIsEsoDialogOpen(true);
                }
              : undefined
          }
        />
      </div>
      <CrossplaneInstallDialog
        open={isCrossplaneDialogOpen}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        mode={crossplaneDialogMode}
        initialData={crossplaneData ?? undefined}
        onClose={() => setIsCrossplaneDialogOpen(false)}
      />
      <ComponentInstallDialog
        open={isFluxDialogOpen}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        componentName="Flux"
        serviceName="flux"
        mode={fluxDialogMode}
        initialVersion={fluxVersion}
        useCreateMutation={useCreateFlux}
        useUpdateMutation={useUpdateFlux}
        onClose={() => setIsFluxDialogOpen(false)}
      />
      <ComponentInstallDialog
        open={isLandscaperDialogOpen}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        componentName="Landscaper"
        serviceName="landscaper"
        mode={landscaperDialogMode}
        initialVersion={landscaperVersion}
        useCreateMutation={useCreateLandscaper}
        useUpdateMutation={useUpdateLandscaper}
        onClose={() => setIsLandscaperDialogOpen(false)}
      />
      <ComponentInstallDialog
        open={isEsoDialogOpen}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        componentName="External Secrets Operator"
        serviceName="external-secrets-operator"
        mode={esoDialogMode}
        initialVersion={esoVersion}
        useCreateMutation={useCreateEso}
        useUpdateMutation={useUpdateEso}
        onClose={() => setIsEsoDialogOpen(false)}
      />
    </Panel>
  );
}
