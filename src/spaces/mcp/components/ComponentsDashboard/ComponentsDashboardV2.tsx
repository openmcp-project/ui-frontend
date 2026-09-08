import { ComponentCardV2 } from '../ComponentCard/ComponentCardV2.tsx';

import { Panel } from '@ui5/webcomponents-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import LogoCrossplane from '../../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../../assets/images/logo-landscaper.svg';
import LogoOcm from '../../../../assets/images/logo-ocm.svg';
import LogoKro from '../../../../assets/images/logo-kro.svg';
import LogoMetricsOperator from '../../../../assets/images/logo-metrics.svg';
import { useComponentCardStatus } from '../../hooks/useComponentCardStatus.ts';
import { useCreateEso } from '../../hooks/useCreateEso.ts';
import { useCreateFlux } from '../../hooks/useCreateFlux.ts';
import { useCreateLandscaper } from '../../hooks/useCreateLandscaper.ts';
import { useCreateOcm } from '../../hooks/useCreateOcm.ts';
import { useCreateKro } from '../../hooks/useCreateKro.ts';
import { useCrossplaneYamlQuery } from '../../hooks/useCrossplaneYamlQuery.ts';
import { useDeleteCrossplane } from '../../hooks/useDeleteCrossplane.ts';
import { useDeleteEso } from '../../hooks/useDeleteEso.ts';
import { useDeleteFlux } from '../../hooks/useDeleteFlux.ts';
import { useDeleteLandscaper } from '../../hooks/useDeleteLandscaper.ts';
import { useDeleteOcm } from '../../hooks/useDeleteOcm.ts';
import { useDeleteKro } from '../../hooks/useDeleteKro.ts';
import { useEsoYamlQuery } from '../../hooks/useEsoYamlQuery.ts';
import { useFluxYamlQuery } from '../../hooks/useFluxYamlQuery.ts';
import { useKroYamlQuery } from '../../hooks/useKroYamlQuery.ts';
import { useLandscaperYamlQuery } from '../../hooks/useLandscaperYamlQuery.ts';
import { useOcmYamlQuery } from '../../hooks/useOcmYamlQuery.ts';
import { useUpdateEso } from '../../hooks/useUpdateEso.ts';
import { useUpdateFlux } from '../../hooks/useUpdateFlux.ts';
import { useUpdateLandscaper } from '../../hooks/useUpdateLandscaper.ts';
import { useUpdateOcm } from '../../hooks/useUpdateOcm.ts';
import { useUpdateKro } from '../../hooks/useUpdateKro.ts';
import { useCreateMetricsOperator } from '../../hooks/useCreateMetricsOperator.ts';
import { useDeleteMetricsOperator } from '../../hooks/useDeleteMetricsOperator.ts';
import { useMetricsOperatorYamlQuery } from '../../hooks/useMetricsOperatorYamlQuery.ts';
import { useUpdateMetricsOperator } from '../../hooks/useUpdateMetricsOperator.ts';
import { CrossplaneInstallDialog } from '../CrossplaneInstallDialog/CrossplaneInstallDialog.tsx';

import { useTranslation } from 'react-i18next';
import { DeleteConfirmationDialog } from '../../../../components/Dialogs/DeleteConfirmationDialog.tsx';
import { useFeatureToggle } from '../../../../context/FeatureToggleContext.tsx';
import { useToast } from '../../../../context/ToastContext.tsx';
import { useTelemetry } from '../../../../lib/telemetry/telemetry.ts';
import type { McpPageSectionId } from '../../pages/ManagedControlPlanePage.tsx';
import type { CrossplaneData } from '../../types/Crossplane.ts';
import type { EsoData } from '../../types/Eso.ts';
import type { FluxData } from '../../types/Flux.ts';
import type { LandscaperData } from '../../types/Landscaper.ts';
import type { OcmData } from '../../types/Ocm.ts';
import type { KroData } from '../../types/Kro.ts';
import type { MetricsOperatorData } from '../../types/MetricsOperator.ts';
import { ComponentInstallDialog } from '../ComponentInstallDialog/ComponentInstallDialog.tsx';
import { YamlViewButton } from '../../../../components/Yaml/YamlViewButton.tsx';
import styles from './ComponentsDashboard.module.css';

type DeleteTarget = 'crossplane' | 'flux' | 'landscaper' | 'eso' | 'ocm' | 'kro' | 'metricsOperator' | null;

// Backend reconciliation after an edit/delete isn't instant; refetching immediately would usually
// just re-read the pre-mutation state. Waiting a beat gives it a chance to catch up.
const REFETCH_DELAY_MS = 3_000;

const DELETE_TARGET_COMPONENT_NAME: Record<NonNullable<DeleteTarget>, string> = {
  crossplane: 'Crossplane',
  flux: 'Flux',
  landscaper: 'Landscaper',
  eso: 'External Secrets Operator',
  ocm: 'OCM',
  kro: 'KRO',
  metricsOperator: 'Metrics Operator',
};

export interface ComponentsDashboardV2Props {
  onNavigateToMcpSection: (sectionId: McpPageSectionId) => void;
  crossplaneData: CrossplaneData | null;
  landscaperData: LandscaperData | null;
  fluxData: FluxData | null;
  esoData: EsoData | null;
  ocmData: OcmData | null;
  kroData: KroData | null;
  metricsOperatorData: MetricsOperatorData | null;
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
  metricsOperatorData,
  mcpName,
  mcpNamespace,
}: ComponentsDashboardV2Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const { showLandscaperCard } = useFeatureToggle();
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

  const [isMetricsOperatorDialogOpen, setIsMetricsOperatorDialogOpen] = useState(false);
  const [metricsOperatorDialogMode, setMetricsOperatorDialogMode] = useState<'install' | 'edit'>('install');

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  // Known limitation, accepted as-is: if this dashboard unmounts within REFETCH_DELAY_MS of a
  // delete/edit, the scheduled refetch below is cleared on unmount and never re-armed (the
  // underlying Apollo query instance is torn down with the component, so there's nothing to
  // refetch into). The existing 30s poll interval on each useXYamlQuery eventually catches up
  // with a stale card, so this isn't fixed here.
  const pendingRefetchTimeouts = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timeouts = pendingRefetchTimeouts.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);
  const scheduleRefetch = useCallback((refetch: () => void) => {
    const timeoutId = setTimeout(() => {
      pendingRefetchTimeouts.current.delete(timeoutId);
      refetch();
    }, REFETCH_DELAY_MS);
    pendingRefetchTimeouts.current.add(timeoutId);
  }, []);

  const { deleteCrossplane } = useDeleteCrossplane();
  const { deleteFlux } = useDeleteFlux();
  const { deleteLandscaper } = useDeleteLandscaper();
  const { deleteEso } = useDeleteEso();
  const { deleteOcm } = useDeleteOcm();
  const { deleteKro } = useDeleteKro();
  const { deleteMetricsOperator } = useDeleteMetricsOperator();

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

  const isMetricsOperatorInstalled = !!metricsOperatorData?.version;
  const metricsOperatorVersion = metricsOperatorData?.version ?? undefined;

  const crossplaneYaml = useCrossplaneYamlQuery(mcpName, mcpNamespace, !isCrossplaneInstalled);
  const { resource: crossplaneResource, status: crossplaneStatus } = useComponentCardStatus(
    isCrossplaneInstalled,
    crossplaneYaml,
  );

  const fluxYaml = useFluxYamlQuery(mcpName, mcpNamespace, !isFluxInstalled);
  const { resource: fluxResource, status: fluxStatus } = useComponentCardStatus(isFluxInstalled, fluxYaml);

  const landscaperYaml = useLandscaperYamlQuery(mcpName, mcpNamespace, !isLandscaperInstalled);
  const { resource: landscaperResource, status: landscaperStatus } = useComponentCardStatus(
    isLandscaperInstalled,
    landscaperYaml,
  );

  const esoYaml = useEsoYamlQuery(mcpName, mcpNamespace, !isEsoInstalled);
  const { resource: esoResource, status: esoStatus } = useComponentCardStatus(isEsoInstalled, esoYaml);

  const ocmYaml = useOcmYamlQuery(mcpName, mcpNamespace, !isOcmInstalled);
  const { resource: ocmResource, status: ocmStatus } = useComponentCardStatus(isOcmInstalled, ocmYaml);

  const kroYaml = useKroYamlQuery(mcpName, mcpNamespace, !isKroInstalled);
  const { resource: kroResource, status: kroStatus } = useComponentCardStatus(isKroInstalled, kroYaml);

  const metricsOperatorYaml = useMetricsOperatorYamlQuery(mcpName, mcpNamespace, !isMetricsOperatorInstalled);
  const { resource: metricsOperatorResource, status: metricsOperatorStatus } = useComponentCardStatus(
    isMetricsOperatorInstalled,
    metricsOperatorYaml,
  );

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) return;
    const componentName = DELETE_TARGET_COMPONENT_NAME[deleteTarget];
    try {
      if (deleteTarget === 'crossplane') {
        await deleteCrossplane({ name: mcpName, namespace: mcpNamespace });
        scheduleRefetch(crossplaneYaml.refetch);
      } else if (deleteTarget === 'flux') {
        await deleteFlux({ name: mcpName, namespace: mcpNamespace });
        scheduleRefetch(fluxYaml.refetch);
      } else if (deleteTarget === 'landscaper') {
        await deleteLandscaper({ name: mcpName, namespace: mcpNamespace });
        scheduleRefetch(landscaperYaml.refetch);
      } else if (deleteTarget === 'eso') {
        await deleteEso({ name: mcpName, namespace: mcpNamespace });
        scheduleRefetch(esoYaml.refetch);
      } else if (deleteTarget === 'ocm') {
        await deleteOcm({ name: mcpName, namespace: mcpNamespace });
        scheduleRefetch(ocmYaml.refetch);
      } else if (deleteTarget === 'kro') {
        await deleteKro({ name: mcpName, namespace: mcpNamespace });
        scheduleRefetch(kroYaml.refetch);
      } else if (deleteTarget === 'metricsOperator') {
        await deleteMetricsOperator({ name: mcpName, namespace: mcpNamespace });
        scheduleRefetch(metricsOperatorYaml.refetch);
      }
      toast.show(t('ComponentCard.deleteSuccessMessage', { component: componentName }));
      telemetry.track({ category: 'component', action: 'uninstalled', componentName });
    } catch {
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
    deleteMetricsOperator,
    scheduleRefetch,
    crossplaneYaml.refetch,
    fluxYaml.refetch,
    landscaperYaml.refetch,
    esoYaml.refetch,
    ocmYaml.refetch,
    kroYaml.refetch,
    metricsOperatorYaml.refetch,
    mcpName,
    mcpNamespace,
    toast,
    t,
    telemetry,
  ]);

  return (
    <Panel fixed>
      <div className={styles['container']}>
        <ComponentCardV2
          data-cy="component-card-crossplane"
          name="Crossplane"
          description={t('componentCardCrossplane.description')}
          logoImgSrc={LogoCrossplane}
          status={crossplaneStatus}
          version={crossplaneVersion}
          yamlViewButton={
            isCrossplaneInstalled && crossplaneResource ? (
              <YamlViewButton
                variant="mcp-component"
                component="crossplane"
                mcpName={mcpName}
                mcpNamespace={mcpNamespace}
                preloadedResource={crossplaneResource}
              />
            ) : undefined
          }
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
        <ComponentCardV2
          data-cy="component-card-flux"
          name="Flux"
          description={t('componentCardFlux.description')}
          logoImgSrc={LogoFlux}
          status={fluxStatus}
          version={fluxVersion}
          yamlViewButton={
            isFluxInstalled && fluxResource ? (
              <YamlViewButton
                variant="mcp-component"
                component="flux"
                mcpName={mcpName}
                mcpNamespace={mcpNamespace}
                preloadedResource={fluxResource}
              />
            ) : undefined
          }
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
        {showLandscaperCard && (
          <ComponentCardV2
            data-cy="component-card-landscaper"
            name="Landscaper"
            description={t('componentCardLandscaper.description')}
            logoImgSrc={LogoLandscaper}
            status={landscaperStatus}
            version={landscaperVersion}
            yamlViewButton={
              isLandscaperInstalled && landscaperResource ? (
                <YamlViewButton
                  variant="mcp-component"
                  component="landscaper"
                  mcpName={mcpName}
                  mcpNamespace={mcpNamespace}
                  preloadedResource={landscaperResource}
                />
              ) : undefined
            }
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
        )}
        <ComponentCardV2
          data-cy="component-card-eso"
          name="External Secrets Operator"
          description={t('componentCardEso.description')}
          logoImgSrc={LogoEso}
          status={esoStatus}
          version={esoVersion}
          yamlViewButton={
            isEsoInstalled && esoResource ? (
              <YamlViewButton
                variant="mcp-component"
                component="eso"
                mcpName={mcpName}
                mcpNamespace={mcpNamespace}
                preloadedResource={esoResource}
              />
            ) : undefined
          }
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
        <ComponentCardV2
          data-cy="component-card-ocm"
          name="OCM"
          description={t('componentCardOcm.description')}
          logoImgSrc={LogoOcm}
          status={ocmStatus}
          version={ocmVersion}
          yamlViewButton={
            isOcmInstalled && ocmResource ? (
              <YamlViewButton
                variant="mcp-component"
                component="ocm"
                mcpName={mcpName}
                mcpNamespace={mcpNamespace}
                preloadedResource={ocmResource}
              />
            ) : undefined
          }
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
        <ComponentCardV2
          data-cy="component-card-kro"
          name="KRO"
          description={t('componentCardKro.description')}
          logoImgSrc={LogoKro}
          status={kroStatus}
          version={kroVersion}
          yamlViewButton={
            isKroInstalled && kroResource ? (
              <YamlViewButton
                variant="mcp-component"
                component="kro"
                mcpName={mcpName}
                mcpNamespace={mcpNamespace}
                preloadedResource={kroResource}
              />
            ) : undefined
          }
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
        <ComponentCardV2
          data-cy="component-card-metrics-operator"
          name="Metrics Operator"
          description={t('componentCardMetricsOperator.description')}
          logoImgSrc={LogoMetricsOperator}
          status={metricsOperatorStatus}
          version={metricsOperatorVersion}
          yamlViewButton={
            isMetricsOperatorInstalled && metricsOperatorResource ? (
              <YamlViewButton
                variant="mcp-component"
                component="metrics-operator"
                mcpName={mcpName}
                mcpNamespace={mcpNamespace}
                preloadedResource={metricsOperatorResource}
              />
            ) : undefined
          }
          onNavigateToComponentSection={undefined}
          onInstallButtonClick={
            !isMetricsOperatorInstalled
              ? () => {
                  setMetricsOperatorDialogMode('install');
                  setIsMetricsOperatorDialogOpen(true);
                }
              : undefined
          }
          onEditButtonClick={
            isMetricsOperatorInstalled
              ? () => {
                  setMetricsOperatorDialogMode('edit');
                  setIsMetricsOperatorDialogOpen(true);
                }
              : undefined
          }
          onDeleteButtonClick={isMetricsOperatorInstalled ? () => setDeleteTarget('metricsOperator') : undefined}
        />
      </div>
      <CrossplaneInstallDialog
        open={isCrossplaneDialogOpen}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        mode={crossplaneDialogMode}
        initialData={crossplaneData ?? undefined}
        onClose={() => setIsCrossplaneDialogOpen(false)}
        onSuccess={(mode) => {
          if (mode === 'edit') scheduleRefetch(crossplaneYaml.refetch);
        }}
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
        onSuccess={(mode) => {
          if (mode === 'edit') scheduleRefetch(fluxYaml.refetch);
        }}
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
        onSuccess={(mode) => {
          if (mode === 'edit') scheduleRefetch(landscaperYaml.refetch);
        }}
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
        onSuccess={(mode) => {
          if (mode === 'edit') scheduleRefetch(esoYaml.refetch);
        }}
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
        onSuccess={(mode) => {
          if (mode === 'edit') scheduleRefetch(ocmYaml.refetch);
        }}
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
        onSuccess={(mode) => {
          if (mode === 'edit') scheduleRefetch(kroYaml.refetch);
        }}
      />
      <ComponentInstallDialog
        open={isMetricsOperatorDialogOpen}
        mcpName={mcpName}
        mcpNamespace={mcpNamespace}
        componentName="Metrics Operator"
        serviceName="metrics-operator"
        mode={metricsOperatorDialogMode}
        initialVersion={metricsOperatorVersion}
        useCreateMutation={useCreateMetricsOperator}
        useUpdateMutation={useUpdateMetricsOperator}
        onClose={() => setIsMetricsOperatorDialogOpen(false)}
        onSuccess={(mode) => {
          if (mode === 'edit') scheduleRefetch(metricsOperatorYaml.refetch);
        }}
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
