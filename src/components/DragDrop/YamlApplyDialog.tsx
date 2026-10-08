import '@ui5/webcomponents-fiori/dist/illustrations/SuccessHighFive';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import '@ui5/webcomponents-icons/dist/accept';
import '@ui5/webcomponents-icons/dist/error';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/document';
import '@ui5/webcomponents-icons/dist/validate';
import '@ui5/webcomponents-icons/dist/cloud';
import '@ui5/webcomponents-icons/dist/org-chart';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import {
  Bar,
  BusyIndicator,
  Button,
  Dialog,
  Icon,
  List,
  ListItemStandard,
  MessageStrip,
  ObjectStatus,
  ProgressIndicator,
  Text,
} from '@ui5/webcomponents-react';
import { useApolloClient } from '@apollo/client/react';
import { parse, stringify } from 'yaml';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiConfigProvider } from '../Shared/k8s';
import { generateCrateAPIConfig } from '../../lib/api/types/apiConfig';
import type { ApiConfig } from '../../lib/api/types/apiConfig';
import { IllustratedBanner } from '../Ui/IllustratedBanner/IllustratedBanner';
import IllustratedError from '../Shared/IllustratedError';
import { YamlResourceEditorSchemaLoader } from '../Yaml/YamlResourceEditorSchemaLoader';
import { useResourcePluralNames } from '../../hooks/useResourcePluralNames';
import {
  type ParsedResource,
  checkCpResourceExists,
  applyCpResource,
  checkOnboardingResourceExists,
  applyOnboardingResource,
  isOnboardingKind,
  supportsOnboardingDryRun,
  parseYamlDocuments,
} from '../../hooks/useYamlApplyResource';
import styles from './YamlApplyDialog.module.css';

/** Whether the resource already exists on the target, plus per-item lifecycle state. */
type ItemState = 'checking' | 'idle' | 'unsupported' | 'applying';
type ItemStatus = 'pending' | 'applied' | 'failed';
type Phase = 'parsing' | 'parse-error' | 'editing' | 'summary';

interface Props {
  file: File;
  targetApiConfig: ApiConfig | null;
  targetName: string;
  onClose: () => void;
}

export function YamlApplyDialog(props: Props) {
  const apiConfig = props.targetApiConfig ?? generateCrateAPIConfig();
  return (
    <ApiConfigProvider apiConfig={apiConfig}>
      <YamlApplyDialogInner {...props} apiConfig={apiConfig} />
    </ApiConfigProvider>
  );
}

interface InnerProps extends Props {
  apiConfig: ApiConfig;
}

function splitApiVersion(apiVersion: string): { group: string; version: string } {
  const parts = apiVersion.split('/');
  return parts.length === 2 ? { group: parts[0], version: parts[1] } : { group: '', version: parts[0] };
}

const YamlApplyDialogInner: FC<InnerProps> = ({ file, targetApiConfig, targetName, onClose, apiConfig }) => {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const { getPluralKind } = useResourcePluralNames();

  const isCpTarget = targetApiConfig !== null;

  const [phase, setPhase] = useState<Phase>('parsing');
  const [parseErrorMessage, setParseErrorMessage] = useState('');

  const [resources, setResources] = useState<ParsedResource[]>([]);
  const [statuses, setStatuses] = useState<ItemStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-item working state, reset whenever the current resource changes.
  const [itemState, setItemState] = useState<ItemState>('checking');
  const [resourceExists, setResourceExists] = useState(false);
  const [itemError, setItemError] = useState('');
  // Result of the last dry run for the current resource (server-side validation preview).
  const [dryRun, setDryRun] = useState<{ status: 'idle' | 'running' | 'ok' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });
  // True while "Apply all" is applying the remaining resources sequentially.
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  // Edited YAML per resource index; falls back to the parsed resource when untouched.
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [validity, setValidity] = useState<{ parseOk: boolean; schemaErrorCount: number }>({
    parseOk: true,
    schemaErrorCount: 0,
  });

  const isMultiDoc = resources.length > 1;
  const currentResource = resources[currentIndex] as ParsedResource | undefined;

  // The YAML the editor should show for the current resource. Derived (not effect-set) so it is
  // always correct at the moment the editor mounts — the editor reads `value` only once per mount.
  const currentYaml = useMemo(
    () => edits[currentIndex] ?? (currentResource ? stringify(currentResource) : ''),
    [edits, currentIndex, currentResource],
  );

  const handleContentChange = useCallback(
    (val: string) => {
      setEdits((prev) => ({ ...prev, [currentIndex]: val }));
      // Edited YAML invalidates any previous dry-run result for this item.
      setDryRun({ status: 'idle', message: '' });
    },
    [currentIndex],
  );

  // ── Parse the dropped file into a queue of resources ──────────────────────
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? '';
      const result = parseYamlDocuments(file.name, content);
      if (!result.valid) {
        setParseErrorMessage(result.message);
        setPhase('parse-error');
        return;
      }
      setResources(result.resources);
      setStatuses(result.resources.map(() => 'pending'));
      setCurrentIndex(0);
      setPhase('editing');
    };
    reader.onerror = () => {
      setParseErrorMessage(t('yamlApply.parseError'));
      setPhase('parse-error');
    };
    reader.readAsText(file);
  }, [file, t]);

  // ── Prepare the current resource: reset per-item state + existence check ──
  useEffect(() => {
    if (phase !== 'editing' || !currentResource) return;
    let cancelled = false;

    const run = async () => {
      setValidity({ parseOk: true, schemaErrorCount: 0 });
      setItemError('');
      setResourceExists(false);
      setItemState('checking');
      setDryRun({ status: 'idle', message: '' });

      try {
        if (isCpTarget) {
          const plural = getPluralKind(currentResource.kind);
          if (!plural) {
            if (!cancelled) {
              setItemError(t('yamlApply.unknownKind', { kind: currentResource.kind }));
              setItemState('unsupported');
            }
            return;
          }
          const exists = await checkCpResourceExists(currentResource, plural, apiConfig);
          if (!cancelled) {
            setResourceExists(exists);
            setItemState('idle');
          }
        } else {
          const kind = currentResource.kind;
          if (!isOnboardingKind(kind)) {
            if (!cancelled) {
              setItemError(t('yamlApply.unsupportedKindOnboarding'));
              setItemState('unsupported');
            }
            return;
          }
          const exists = await checkOnboardingResourceExists(currentResource, apolloClient);
          if (!cancelled) {
            setResourceExists(exists);
            setItemState('idle');
          }
        }
      } catch {
        if (!cancelled) {
          // Existence check failed — treat as new; the apply call will surface real errors.
          setResourceExists(false);
          setItemState('idle');
        }
      }
    };
    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, resources]);

  const advanceAfterApply = useCallback(
    (doneIndex: number) => {
      // Jump to the next still-pending resource; if none remain, show the summary.
      const n = resources.length;
      for (let off = 1; off <= n; off++) {
        const i = (doneIndex + off) % n;
        if (i === doneIndex) continue;
        if (statuses[i] === 'pending') {
          setCurrentIndex(i);
          return;
        }
      }
      setPhase('summary');
    },
    [resources.length, statuses],
  );

  const markStatus = useCallback((index: number, status: ItemStatus) => {
    setStatuses((prev) => {
      const copy = [...prev];
      copy[index] = status;
      return copy;
    });
  }, []);

  // Projects are always created (never updated) via this flow.
  const isProject = !isCpTarget && currentResource?.kind === 'Project';
  const showOverwrite = resourceExists && !isProject;

  const doApply = useCallback(async () => {
    if (!currentResource) return;
    const index = currentIndex;
    setItemState('applying');
    setItemError('');

    // Re-parse the (possibly edited) YAML from the editor.
    let resource: ParsedResource = currentResource;
    try {
      resource = parse(currentYaml) as ParsedResource;
    } catch {
      resource = currentResource;
    }

    try {
      if (isCpTarget) {
        const plural = getPluralKind(resource.kind);
        if (!plural) {
          throw new Error(t('yamlApply.unknownKind', { kind: resource.kind }));
        }
        await applyCpResource(resource, plural, apiConfig);
      } else {
        const result = await applyOnboardingResource(resource, resourceExists, apolloClient);
        if (!result.success) {
          throw new Error(t('yamlApply.unsupportedKindOnboarding'));
        }
      }
      markStatus(index, 'applied');
      advanceAfterApply(index);
    } catch (err) {
      setItemError(err instanceof Error ? err.message : String(err));
      markStatus(index, 'failed');
      setItemState('idle');
    }
  }, [
    currentResource,
    currentIndex,
    currentYaml,
    isCpTarget,
    getPluralKind,
    apiConfig,
    resourceExists,
    apolloClient,
    t,
    markStatus,
    advanceAfterApply,
  ]);

  // Server-side validation of the current (possibly edited) resource without persisting.
  // CP targets use `?dryRun=All`; the Onboarding API only supports it for v2 ControlPlane.
  const canDryRun =
    phase === 'editing' &&
    itemState !== 'unsupported' &&
    (isCpTarget || (currentResource ? supportsOnboardingDryRun(currentResource.kind) : false));

  const doDryRun = useCallback(async () => {
    if (!currentResource) return;
    setDryRun({ status: 'running', message: '' });

    let resource: ParsedResource = currentResource;
    try {
      resource = parse(currentYaml) as ParsedResource;
    } catch {
      resource = currentResource;
    }

    try {
      if (isCpTarget) {
        const plural = getPluralKind(resource.kind);
        if (!plural) throw new Error(t('yamlApply.unknownKind', { kind: resource.kind }));
        await applyCpResource(resource, plural, apiConfig, true);
      } else {
        await applyOnboardingResource(resource, resourceExists, apolloClient, true);
      }
      setDryRun({ status: 'ok', message: t('yamlApply.dryRunOk') });
    } catch (err) {
      setDryRun({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [currentResource, currentYaml, isCpTarget, getPluralKind, apiConfig, resourceExists, apolloClient, t]);

  // Apply every still-pending resource in order, continuing past failures, then show the summary.
  const doApplyAll = useCallback(async () => {
    setIsApplyingAll(true);
    try {
      for (let i = 0; i < resources.length; i++) {
        if (statuses[i] !== 'pending') continue;
        const raw = edits[i] ?? stringify(resources[i]);
        let resource: ParsedResource = resources[i];
        try {
          resource = parse(raw) as ParsedResource;
        } catch {
          resource = resources[i];
        }
        try {
          if (isCpTarget) {
            const plural = getPluralKind(resource.kind);
            if (!plural) throw new Error(t('yamlApply.unknownKind', { kind: resource.kind }));
            await applyCpResource(resource, plural, apiConfig);
          } else {
            const exists = await checkOnboardingResourceExists(resource, apolloClient);
            const result = await applyOnboardingResource(resource, exists, apolloClient);
            if (!result.success) throw new Error(t('yamlApply.unsupportedKindOnboarding'));
          }
          markStatus(i, 'applied');
        } catch {
          markStatus(i, 'failed');
        }
      }
    } finally {
      setIsApplyingAll(false);
      setPhase('summary');
    }
  }, [resources, statuses, edits, isCpTarget, getPluralKind, apiConfig, apolloClient, t, markStatus]);

  // ── Presentation helpers ──────────────────────────────────────────────────
  const targetBanner = (
    <div className={styles.targetBar}>
      <Text className={styles.targetLabel}>{t('yamlApply.targetLabel')}</Text>
      <ObjectStatus
        state={isCpTarget ? 'Positive' : 'Information'}
        icon={<Icon name={isCpTarget ? 'cloud' : 'org-chart'} />}
        inverted
      >
        {isCpTarget ? targetName : t('yamlApply.targetOnboarding')}
      </ObjectStatus>
    </div>
  );

  const completedCount = statuses.filter((s) => s !== 'pending').length;
  const progressValue = resources.length > 0 ? Math.round((completedCount / resources.length) * 100) : 0;
  const progressState = statuses.some((s) => s === 'failed') ? 'Negative' : 'Information';

  const itemVisual = (status: ItemStatus, isCurrent: boolean) => {
    if (status === 'applied')
      return { icon: 'accept', highlight: 'Positive' as const, text: t('yamlApply.statusApplied') };
    if (status === 'failed')
      return { icon: 'error', highlight: 'Negative' as const, text: t('yamlApply.statusFailed') };
    if (isCurrent) return { icon: 'edit', highlight: 'Information' as const, text: '' };
    return { icon: 'document', highlight: 'None' as const, text: '' };
  };

  const jumpToIndex = (idx: number) => {
    if (itemState === 'applying' || isApplyingAll || Number.isNaN(idx) || idx === currentIndex) return;
    setCurrentIndex(idx);
  };

  const progressPanel = isMultiDoc ? (
    <div className={styles.progressPanel}>
      <div className={styles.progressHeader}>
        <Text className={styles.progressLabel}>
          {t('yamlApply.stepProgress', { current: currentIndex + 1, total: resources.length })}
        </Text>
        <ProgressIndicator value={progressValue} valueState={progressState} hideValue />
      </div>
      <List
        selectionMode="Single"
        className={styles.progressList}
        onSelectionChange={(e) => {
          const item = e.detail.selectedItems[0] as HTMLElement | undefined;
          jumpToIndex(Number(item?.dataset.index));
        }}
      >
        {resources.map((r, i) => {
          const v = itemVisual(statuses[i], i === currentIndex);
          return (
            <ListItemStandard
              key={i}
              data-index={i}
              selected={i === currentIndex}
              icon={v.icon}
              highlight={v.highlight}
              additionalText={v.text}
            >
              {r.kind}/{r.metadata.name}
            </ListItemStandard>
          );
        })}
      </List>
    </div>
  ) : null;

  const applyDisabled =
    itemState === 'checking' ||
    itemState === 'applying' ||
    itemState === 'unsupported' ||
    isApplyingAll ||
    dryRun.status === 'running' ||
    !validity.parseOk ||
    validity.schemaErrorCount > 0;

  const applyLabel = showOverwrite ? t('yamlApply.overwriteButton') : t('yamlApply.createButton');

  const pendingCount = statuses.filter((s) => s === 'pending').length;
  const showApplyAll = phase === 'editing' && isMultiDoc && pendingCount > 1;

  // The summary ('Apply complete') screen is always closable — the per-item working state
  // may still read 'applying' after the final successful apply advanced us here.
  const canClose = phase === 'summary' || (itemState !== 'applying' && !isApplyingAll && phase !== 'parsing');

  const footer = (
    <Bar
      design="Footer"
      endContent={
        <>
          {canDryRun && (
            <Button
              design="Transparent"
              disabled={applyDisabled || itemState !== 'idle'}
              icon="validate"
              onClick={doDryRun}
            >
              {t('yamlApply.dryRunButton')}
            </Button>
          )}
          {showApplyAll && (
            <Button design="Emphasized" disabled={applyDisabled} onClick={doApplyAll}>
              {t('yamlApply.applyAllButton')}
            </Button>
          )}
          {phase === 'editing' && (
            <Button design={showOverwrite ? 'Negative' : 'Emphasized'} disabled={applyDisabled} onClick={doApply}>
              {applyLabel}
            </Button>
          )}
          {canClose && (
            <Button design="Transparent" onClick={onClose}>
              {phase === 'summary' ? t('yamlApply.closeButton') : t('yamlApply.cancelButton')}
            </Button>
          )}
        </>
      }
    />
  );

  const summary = useMemo(() => {
    const applied = statuses.filter((s) => s === 'applied').length;
    const failed = statuses.filter((s) => s === 'failed').length;
    return { applied, failed };
  }, [statuses]);

  return (
    <Dialog
      open
      stretch
      headerText={t('yamlApply.dialogTitle')}
      footer={footer}
      onClose={canClose ? onClose : undefined}
    >
      <div className={styles.body}>
        {phase === 'parsing' && (
          <div className={styles.center}>
            <BusyIndicator active delay={0} />
          </div>
        )}

        {phase === 'parse-error' && (
          <div className={styles.center}>
            <IllustratedError
              title={parseErrorMessage.includes('.') ? t('yamlApply.fileTypeError') : t('yamlApply.parseError')}
              details={parseErrorMessage || t('yamlApply.structureError')}
            />
          </div>
        )}

        {phase === 'editing' && currentResource && (
          <div className={styles.editingContainer}>
            {targetBanner}

            <div className={styles.editLayout}>
              {progressPanel}

              <div className={styles.editMain}>
                {itemState === 'unsupported' && (
                  <MessageStrip design="Negative" hideCloseButton className={styles.strip}>
                    {itemError}
                  </MessageStrip>
                )}

                {itemState !== 'unsupported' && showOverwrite && (
                  <MessageStrip design="Critical" hideCloseButton className={styles.strip}>
                    {t('yamlApply.overwriteWarning', {
                      kind: currentResource.kind,
                      name: currentResource.metadata.name,
                    })}
                  </MessageStrip>
                )}

                {itemState !== 'unsupported' && isProject && resourceExists && (
                  <MessageStrip design="Information" hideCloseButton className={styles.strip}>
                    {t('yamlApply.projectExistsInfo', { name: currentResource.metadata.name })}
                  </MessageStrip>
                )}

                {itemError && itemState === 'idle' && (
                  <MessageStrip design="Negative" hideCloseButton className={styles.strip}>
                    {itemError}
                  </MessageStrip>
                )}

                {dryRun.status === 'ok' && (
                  <MessageStrip design="Positive" hideCloseButton className={styles.strip}>
                    {dryRun.message}
                  </MessageStrip>
                )}

                {dryRun.status === 'error' && (
                  <MessageStrip design="Negative" hideCloseButton className={styles.strip}>
                    {t('yamlApply.dryRunFailedTitle')}: {dryRun.message}
                  </MessageStrip>
                )}

                <div className={styles.editorWrapper}>
                  <YamlResourceEditorSchemaLoader
                    key={currentIndex}
                    yamlString={currentYaml}
                    filename={`${currentResource.kind}-${currentResource.metadata.name}`}
                    apiGroupName={splitApiVersion(currentResource.apiVersion).group}
                    apiVersion={splitApiVersion(currentResource.apiVersion).version}
                    kind={currentResource.kind}
                    isEdit
                    hideToolbar
                    height="100%"
                    onContentChange={handleContentChange}
                    onValidityChange={setValidity}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'summary' && (
          <div className={styles.center}>
            <IllustratedBanner
              illustrationName={
                summary.failed > 0 ? IllustrationMessageType.SimpleError : IllustrationMessageType.SuccessHighFive
              }
              title={t('yamlApply.summaryTitle')}
              subtitle={t('yamlApply.summaryCounts', {
                applied: summary.applied,
                failed: summary.failed,
              })}
            />
          </div>
        )}
      </div>
    </Dialog>
  );
};
