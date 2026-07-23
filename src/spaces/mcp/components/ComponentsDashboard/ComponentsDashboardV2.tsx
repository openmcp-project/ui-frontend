import { ComponentCard } from '../ComponentCard/ComponentCard.tsx';

import { Panel } from '@ui5/webcomponents-react';
import { useCallback, useState } from 'react';
import LogoCrossplane from '../../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../../assets/images/logo-landscaper.svg';
import LogoOcm from '../../../../assets/images/logo-ocm.svg';
import LogoKro from '../../../../assets/images/logo-kro.svg';
import { useCreateEso } from '../../hooks/useCreateEso.ts';
import { useCreateFlux } from '../../hooks/useCreateFlux.ts';
import { useCreateLandscaper } from '../../hooks/useCreateLandscaper.ts';
import { useCreateOcm } from '../../hooks/useCreateOcm.ts';
import { useCreateKro } from '../../hooks/useCreateKro.ts';
import { useDeleteCrossplane } from '../../hooks/useDeleteCrossplane.ts';
import { useDeleteEso } from '../../hooks/useDeleteEso.ts';
import { useDeleteFlux } from '../../hooks/useDeleteFlux.ts';
import { useDeleteLandscaper } from '../../hooks/useDeleteLandscaper.ts';
import { useDeleteOcm } from '../../hooks/useDeleteOcm.ts';
import { useDeleteKro } from '../../hooks/useDeleteKro.ts';
import { useUpdateEso } from '../../hooks/useUpdateEso.ts';
import { useUpdateFlux } from '../../hooks/useUpdateFlux.ts';
import { useUpdateLandscaper } from '../../hooks/useUpdateLandscaper.ts';
import { useUpdateOcm } from '../../hooks/useUpdateOcm.ts';
import { useUpdateKro } from '../../hooks/useUpdateKro.ts';
import { CrossplaneInstallDialog } from '../CrossplaneInstallDialog/CrossplaneInstallDialog.tsx';

import { useTranslation } from 'react-i18next';
import { DeleteConfirmationDialog } from '../../../../components/Dialogs/DeleteConfirmationDialog.tsx';
import { useToast } from '../../../../context/ToastContext.tsx';
import { useTelemetry } from '../../../../lib/telemetry/telemetry.ts';
import type { McpPageSectionId } from '../../pages/ManagedControlPlanePage.tsx';
import type { CrossplaneData } from '../../types/Crossplane.ts';
import type { EsoData } from '../../types/Eso.ts';
import type { FluxData } from '../../types/Flux.ts';
import type { LandscaperData } from '../../types/Landscaper.ts';
import type { OcmData } from '../../types/Ocm.ts';
import type { KroData } from '../../types/Kro.ts';
import { ComponentInstallDialog } from '../ComponentInstallDialog/ComponentInstallDialog.tsx';
import styles from './ComponentsDashboard.module.css';

type DeleteTarget = 'crossplane' | 'flux' | 'landscaper' | 'eso' | 'ocm' | 'kro' | null;

const DELETE_TARGET_COMPONENT_NAME: Record<NonNullable<DeleteTarget>, string> = {
  crossplane: 'Crossplane',
  flux: 'Flux',
  landscaper: 'Landscaper',
  eso: 'External Secrets Operator',
  ocm: 'OCM',
  kro: 'KRO',
};

export interface ComponentsDashboardV2Props {
  onNavigateToMcpSection: (sectionId: McpPageSectionId) => void;
  crossplaneData: CrossplaneData | null;
  landscaperData: LandscaperData | null;
  fluxData: FluxData | null;
  esoData: EsoData | null;
  ocmData: OcmData | null;
  kroData: KroData | null;
  mcpName: string;
  mcpNamespace: string;
}

export function ComponentsDashboardV2({
  onNavigateToMcpSection,
  crossplaneData,
  landscaperData,
  fluxData,
  esoData,
  ocmData,
  kroData,
  mcpName,
  mcpNamespace,
}: ComponentsDashboardV2Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const telemetry = useTelemetry();

  const [isCrossplaneDialogOpen, setIsCrossplaneDialogOpen] = useState(false);
  const [crossplaneDialogMode, setCrossplaneDialogMode] = useState<'install' | 'edit'>('install');

  const [isFluxDialogOpen, setIsFluxDialogOpen] = useState(false);
  const [fluxDialogMode, setFluxDialogMode] = useState<'install' | 'edit'>('install');

  const [isLandscaperDialogOpen, setIsLandscaperDialogOpen] = useState(false);
  const [landscaperDialogMode, setLandscaperDialogMode] = useState<'install' | 'edit'>('install');

  const [isEsoDialogOpen, setIsEsoDialogOpen] = useState(false);
  const [esoDialogMode, setEsoDialogMode] = useState<'install' | 'edit'>('install');

  const [isOcmDialogOpen, setIsOcmDialogOpen] = useState(false);
  const [ocmDialogMode, setOcmDialogMode] = useState<'install' | 'edit'>('install');

  const [isKroDialogOpen, setIsKroDialogOpen] = useState(false);
  const [kroDialogMode, setKroDialogMode] = useState<'install' | 'edit'>('install');

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const { deleteCrossplane } = useDeleteCrossplane();
  const { deleteFlux } = useDeleteFlux();
  const { deleteLandscaper } = useDeleteLandscaper();
  const { deleteEso } = useDeleteEso();
  const { deleteOcm } = useDeleteOcm();
  const { deleteKro } = useDeleteKro();

  const isCrossplaneInstalled = !!crossplaneData?.version;
  const crossplaneVersion = crossplaneData?.version ?? undefined;

  const isLandscaperInstalled = !!landscaperData?.version;
  const landscaperVersion = landscaperData?.version ?? undefined;

  const isFluxInstalled = !!fluxData?.version;
  const fluxVersion = fluxData?.version ?? undefined;

  const isEsoInstalled = !!esoData?.version;
  const esoVersion = esoData?.version ?? undefined;

  const isOcmInstalled = !!ocmData?.version;
  const ocmVersion = ocmData?.version ?? undefined;

  const isKroInstalled = !!kroData?.version;
  const kroVersion = kroData?.version ?? undefined;

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) return;
    const componentName = DELETE_TARGET_COMPONENT_NAME[deleteTarget];
    try {
      if (deleteTarget === 'crossplane') {
        await deleteCrossplane({ name: mcpName, namespace: mcpNamespace });
      } else if (deleteTarget === 'flux') {
        await deleteFlux({ name: mcpName, namespace: mcpNamespace });
      } else if (deleteTarget === 'landscaper') {
        await deleteLandscaper({ name: mcpName, namespace: mcpNamespace });
      } else if (deleteTarget === 'eso') {
        await deleteEso({ name: mcpName, namespace: mcpNamespace });
      } else if (deleteTarget === 'ocm') {
        await deleteOcm({ name: mcpName, namespace: mcpNamespace });
      } else if (deleteTarget === 'kro') {
        await deleteKro({ name: mcpName, namespace: mcpNamespace });
      }
      toast.show(t('ComponentCard.deleteSuccessMessage', { component: componentName }));
      telemetry.track({ name: 'component.uninstalled', componentName });
    } catch (error) {
      console.error(`${componentName} delete failed`, error);
      toast.show(t('ComponentCard.deleteErrorMessage', { component: componentName }));
    }
  }, [
    deleteTarget,
    deleteCrossplane,
    deleteFlux,
    deleteLandscaper,
    deleteEso,
    deleteOcm,
    deleteKro,
    mcpName,
    mcpNamespace,
    toast,
    t,
    telemetry,
  ]);

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
          onDeleteButtonClick={isCrossplaneInstalled ? () => setDeleteTarget('crossplane') : undefined}
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
          onDeleteButtonClick={isFluxInstalled ? () => setDeleteTarget('flux') : undefined}
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
          onDeleteButtonClick={isLandscaperInstalled ? () => setDeleteTarget('landscaper') : undefined}
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
          onDeleteButtonClick={isEsoInstalled ? () => setDeleteTarget('eso') : undefined}
        />
        <ComponentCard
          name="OCM"
          description={t('componentCardOcm.description')}
          logoImgSrc={LogoOcm}
          isInstalled={isOcmInstalled}
          version={ocmVersion}
          kpiType="enabled"
          onNavigateToComponentSection={undefined}
          onInstallButtonClick={
            !isOcmInstalled
              ? () => {
                  setOcmDialogMode('install');
                  setIsOcmDialogOpen(true);
                }
              : undefined
          }
          onEditButtonClick={
            isOcmInstalled
              ? () => {
                  setOcmDialogMode('edit');
                  setIsOcmDialogOpen(true);
                }
              : undefined
          }
          onDeleteButtonClick={isOcmInstalled ? () => setDeleteTarget('ocm') : undefined}
        />
        <ComponentCard
          name="KRO"
          description={t('componentCardKro.description')}
          logoImgSrc={LogoKro}
          isInstalled={isKroInstalled}
          version={kroVersion}
          kpiType="enabled"
          onNavigateToComponentSection={undefined}
          onInstallButtonClick={
            !isKroInstalled
              ? () => {
                  setKroDialogMode('install');
                  setIsKroDialogOpen(true);
                }
              : undefined
          }
          onEditButtonClick={
            isKroInstalled
              ? () => {
                  setKroDialogMode('edit');
                  setIsKroDialogOpen(true);
                }
              : undefined
          }
          onDeleteButtonClick={isKroInstalled ? () => setDeleteTarget('kro') : undefined}
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
      <ComponentInstallDialog
        open={isOcmDialogOpen}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        componentName="OCM"
        serviceName="ocm"
        mode={ocmDialogMode}
        initialVersion={ocmVersion}
        useCreateMutation={useCreateOcm}
        useUpdateMutation={useUpdateOcm}
        onClose={() => setIsOcmDialogOpen(false)}
      />
      <ComponentInstallDialog
        open={isKroDialogOpen}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        componentName="KRO"
        serviceName="kro"
        mode={kroDialogMode}
        initialVersion={kroVersion}
        useCreateMutation={useCreateKro}
        useUpdateMutation={useUpdateKro}
        onClose={() => setIsKroDialogOpen(false)}
      />
      {deleteTarget && (
        <DeleteConfirmationDialog
          isOpen={true}
          setIsOpen={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          resourceName={DELETE_TARGET_COMPONENT_NAME[deleteTarget]}
          onDeletionConfirmed={handleDeleteConfirmed}
          onCanceled={() => setDeleteTarget(null)}
        />
      )}
    </Panel>
  );
}
