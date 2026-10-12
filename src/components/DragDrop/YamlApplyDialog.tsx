import '@ui5/webcomponents-fiori/dist/illustrations/ReceiveAppreciation';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import '@ui5/webcomponents-icons/dist/accept';
import '@ui5/webcomponents-icons/dist/error';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/document';
import '@ui5/webcomponents-icons/dist/validate';
import '@ui5/webcomponents-icons/dist/cloud';
import '@ui5/webcomponents-icons/dist/org-chart';
import '@ui5/webcomponents-icons/dist/decline';
import '@ui5/webcomponents-icons/dist/add';
import {
  Bar,
  BusyIndicator,
  Button,
  Dialog,
  Icon,
  MessageStrip,
  ObjectStatus,
  ProgressIndicator,
  Text,
} from '@ui5/webcomponents-react';
import { useApolloClient } from '@apollo/client/react';
import { parse, stringify } from 'yaml';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiConfigProvider } from '../Shared/k8s';
import { generateCrateAPIConfig } from '../../lib/api/types/apiConfig';
import type { ApiConfig } from '../../lib/api/types/apiConfig';
import IllustratedError from '../Shared/IllustratedError';
import { IllustratedBanner } from '../Ui/IllustratedBanner/IllustratedBanner';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { YamlResourceEditorSchemaLoader } from '../Yaml/YamlResourceEditorSchemaLoader';
import { useResourcePluralNames as _useResourcePluralNames } from '../../hooks/useResourcePluralNames';
import { isForbiddenError } from '../../lib/api/error';
import type { APIError } from '../../lib/api/error';
import {
  type ParsedResource,
  type ValidationError,
  checkCpResourceExists,
  applyCpResource,
  checkOnboardingResourceExists,
  applyOnboardingResource,
  isOnboardingKind,
  supportsOnboardingDryRun,
  nextIndexAfterRemove,
  parseYamlDocuments,
  resourceIdentity,
} from '../../hooks/useYamlApplyResource';
import styles from './YamlApplyDialog.module.css';

/** Whether the resource already exists on the target, plus per-item lifecycle state. */
type ItemState = 'checking' | 'idle' | 'unsupported' | 'applying';
type ItemStatus = 'pending' | 'applied' | 'failed';
type Phase = 'parsing' | 'parse-error' | 'editing' | 'summary';

interface Props {
  files: File[];
  targetApiConfig: ApiConfig | null;
  targetName: string;
  onClose: () => void;
  /** Lets the drag-drop provider push files dropped onto the open dialog into this queue. */
  onRegisterAppend?: (handler: ((files: File[]) => void) | null) => void;
  /** True while a file is being dragged anywhere over the page with the dialog open. */
  isExternalDragActive?: boolean;
  /** Injectable for tests (CRD plural-name resolution for Control Plane targets). */
  useResourcePluralNames?: typeof _useResourcePluralNames;
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

const YamlApplyDialogInner: FC<InnerProps> = ({
  files,
  targetApiConfig,
  targetName,
  onClose,
  onRegisterAppend,
  isExternalDragActive,
  useResourcePluralNames = _useResourcePluralNames,
  apiConfig,
}) => {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const { getPluralKind } = useResourcePluralNames();

  const isCpTarget = targetApiConfig !== null;

  const [phase, setPhase] = useState<Phase>('parsing');
  const [parseErrorMessage, setParseErrorMessage] = useState('');
  const [parseErrorType, setParseErrorType] = useState<ValidationError | null>(null);
  const [parseErrorFileName, setParseErrorFileName] = useState('');

  const [resources, setResources] = useState<ParsedResource[]>([]);
  // Original source text per queue slot (aligned 1:1 with `resources`), used to seed the editor so
  // comments/formatting survive the split; falls back to re-serializing the parsed resource.
  const [texts, setTexts] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<ItemStatus[]>([]);
  // Stable id per queue slot, aligned 1:1 with `resources`/`statuses`. Keeps the editor and the
  // id-keyed `edits`/`itemErrors` maps correct across removals and insertions.
  const [ids, setIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const idCounter = useRef(0);
  const newId = useCallback(() => `item-${idCounter.current++}`, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Per-item working state, reset whenever the current resource changes.
  const [itemState, setItemState] = useState<ItemState>('checking');
  const [resourceExists, setResourceExists] = useState(false);
  // True when the existence check could not be completed (e.g. 403) — we don't know if the
  // resource exists, so we warn and let the apply (create-or-overwrite) proceed.
  const [existenceIndeterminate, setExistenceIndeterminate] = useState(false);
  const [itemError, setItemError] = useState('');
  // Result of the last dry run for the current resource (server-side validation preview).
  const [dryRun, setDryRun] = useState<{ status: 'idle' | 'running' | 'ok' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });
  // True while "Apply all" is applying the remaining resources sequentially.
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  // Edited YAML per queue slot, keyed by stable id; falls back to the parsed resource when untouched.
  const [edits, setEdits] = useState<Record<string, string>>({});
  // Error message per queue slot (stable id) for failed applies — surfaced in the summary.
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  // Transient error from a failed "add file" attempt (bad extension / parse error / duplicate).
  const [addError, setAddError] = useState('');
  const [validity, setValidity] = useState<{ parseOk: boolean; schemaErrorCount: number; schemaStale?: boolean }>({
    parseOk: true,
    schemaErrorCount: 0,
  });

  const isMultiDoc = resources.length > 1;
  const currentResource = resources[currentIndex] as ParsedResource | undefined;
  const currentId = ids[currentIndex];

  // The YAML the editor should show for the current resource. Prefers the user's edit, then the
  // original source text (comments preserved), then a re-serialized fallback. Derived (not
  // effect-set) so it is always correct at the moment the editor mounts — the editor reads `value`
  // only once per mount.
  const currentYaml = useMemo(() => {
    if (currentId && edits[currentId] != null) return edits[currentId];
    return texts[currentIndex] ?? (currentResource ? stringify(currentResource) : '');
  }, [edits, currentId, texts, currentIndex, currentResource]);

  // The resource as currently shown in the editor (parsed from `currentYaml`). Edits to
  // name/kind/namespace must drive the Create/Overwrite labelling and existence check — not the
  // originally-parsed resource. Falls back to the parsed resource when the edit can't be parsed.
  const effectiveResource = useMemo(() => {
    if (!currentResource) return undefined;
    try {
      const parsed = parse(currentYaml) as ParsedResource;
      return parsed && typeof parsed === 'object' && parsed.kind ? parsed : currentResource;
    } catch {
      return currentResource;
    }
  }, [currentYaml, currentResource]);

  const effectiveIdentity = effectiveResource ? resourceIdentity(effectiveResource) : '';

  const handleContentChange = useCallback(
    (val: string) => {
      if (!currentId) return;
      setEdits((prev) => ({ ...prev, [currentId]: val }));
      // Edited YAML invalidates any previous dry-run result for this item.
      setDryRun({ status: 'idle', message: '' });
    },
    [currentId],
  );

  // ── Parse the dropped/selected files into a single queue of resources ─────
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const merged: ParsedResource[] = [];
      const mergedTexts: string[] = [];
      for (const file of files) {
        let content: string;
        try {
          content = await file.text();
        } catch {
          if (!cancelled) {
            setParseErrorType('parse-error');
            setParseErrorMessage(t('yamlApply.parseError', { filename: file.name }));
            setParseErrorFileName(file.name);
            setPhase('parse-error');
          }
          return;
        }
        const result = parseYamlDocuments(file.name, content);
        if (!result.valid) {
          if (!cancelled) {
            setParseErrorType(result.error);
            setParseErrorMessage(result.message);
            setParseErrorFileName(file.name);
            setPhase('parse-error');
          }
          return;
        }
        merged.push(...result.resources);
        mergedTexts.push(...result.texts);
      }
      if (cancelled) return;
      if (merged.length === 0) {
        setParseErrorType('empty-file');
        setParseErrorMessage('');
        setPhase('parse-error');
        return;
      }
      setResources(merged);
      setTexts(mergedTexts);
      setStatuses(merged.map(() => 'pending'));
      setIds(merged.map(() => newId()));
      setEdits({});
      setItemErrors({});
      setAddError('');
      setCurrentIndex(0);
      setPhase('editing');
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [files, t, newId]);

  // ── Prepare the current resource: reset per-item state + existence check ──
  // Keyed on the *edited* identity (`effectiveIdentity`) so retyping name/kind/namespace re-checks
  // existence (and flips Create/Overwrite). The network check is debounced so typing doesn't spam it.
  useEffect(() => {
    if (phase !== 'editing' || !effectiveResource) return;
    let cancelled = false;

    const run = async () => {
      // Reset per-item working state immediately so the UI reflects the switch/edit at once.
      setValidity({ parseOk: true, schemaErrorCount: 0 });
      setItemError('');
      setResourceExists(false);
      setExistenceIndeterminate(false);
      setItemState('checking');
      setDryRun({ status: 'idle', message: '' });

      // Debounce the network existence check so typing a name doesn't fire a request per keystroke.
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (cancelled) return;

      const resource = effectiveResource;
      try {
        if (isCpTarget) {
          const plural = getPluralKind(resource.kind);
          if (!plural) {
            if (!cancelled) {
              setItemError(t('yamlApply.unknownKind', { kind: resource.kind }));
              setItemState('unsupported');
            }
            return;
          }
          const exists = await checkCpResourceExists(resource, plural, apiConfig);
          if (!cancelled) {
            setResourceExists(exists);
            setItemState('idle');
          }
        } else {
          const kind = resource.kind;
          if (!isOnboardingKind(kind)) {
            // No dedicated mutation for this kind — it is applied generically via `applyYaml`
            // (server-side create-or-update). There is no per-kind existence check, so go idle.
            if (!cancelled) {
              setResourceExists(false);
              setItemState('idle');
            }
            return;
          }
          const exists = await checkOnboardingResourceExists(resource, apolloClient);
          if (!cancelled) {
            setResourceExists(exists);
            setItemState('idle');
          }
        }
      } catch (err) {
        if (!cancelled) {
          // A 403 means we couldn't determine existence — warn rather than silently assume "new".
          // Any other failure is treated as new; the apply call will surface real errors.
          if (isForbiddenError(err as APIError)) setExistenceIndeterminate(true);
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
  }, [phase, effectiveIdentity]);

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

  // Projects are always created (never updated) via this flow. Based on the edited content so
  // changing the kind in the editor updates the labelling.
  const isProject = !isCpTarget && effectiveResource?.kind === 'Project';
  const showOverwrite = resourceExists && !isProject;

  const doApply = useCallback(async () => {
    if (!currentResource) return;
    const index = currentIndex;

    // Re-parse the (possibly edited) YAML. Never silently fall back to the pre-edit resource —
    // apply exactly what the editor shows, or refuse if it can't be parsed.
    let resource: ParsedResource;
    try {
      resource = parse(currentYaml) as ParsedResource;
    } catch {
      setItemError(t('yamlApply.invalidYaml'));
      setItemState('idle');
      return;
    }

    setItemState('applying');
    setItemError('');

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
      setItemErrors((prev) => {
        const next = { ...prev };
        delete next[ids[index]];
        return next;
      });
      advanceAfterApply(index);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setItemError(message);
      setItemErrors((prev) => ({ ...prev, [ids[index]]: message }));
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
    ids,
    t,
    markStatus,
    advanceAfterApply,
  ]);

  // Server-side validation of the current (possibly edited) resource without persisting.
  // CP targets use `?dryRun=All`; the Onboarding API only supports it for v2 ControlPlane.
  const canDryRun =
    phase === 'editing' &&
    itemState !== 'unsupported' &&
    (isCpTarget || (effectiveResource ? supportsOnboardingDryRun(effectiveResource.kind) : false));

  const doDryRun = useCallback(async () => {
    if (!currentResource) return;

    // Refuse to dry-run unparseable YAML rather than validating the stale pre-edit resource.
    let resource: ParsedResource;
    try {
      resource = parse(currentYaml) as ParsedResource;
    } catch {
      setDryRun({ status: 'error', message: t('yamlApply.invalidYaml') });
      return;
    }

    setDryRun({ status: 'running', message: '' });

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
        const raw = edits[ids[i]] ?? texts[i] ?? stringify(resources[i]);
        // Each item's edit may be invalid even though it isn't the one shown in the editor (only the
        // mounted item is schema-validated). Fail it explicitly rather than applying the pre-edit copy.
        let resource: ParsedResource;
        try {
          resource = parse(raw) as ParsedResource;
        } catch {
          setItemErrors((prev) => ({ ...prev, [ids[i]]: t('yamlApply.invalidYaml') }));
          markStatus(i, 'failed');
          continue;
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
          setItemErrors((prev) => {
            const next = { ...prev };
            delete next[ids[i]];
            return next;
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          setItemErrors((prev) => ({ ...prev, [ids[i]]: message }));
          markStatus(i, 'failed');
        }
      }
    } finally {
      setIsApplyingAll(false);
      setPhase('summary');
    }
  }, [resources, texts, statuses, edits, ids, isCpTarget, getPluralKind, apiConfig, apolloClient, t, markStatus]);

  // Add more YAML (from the "Add file" button or a drop onto the open dialog) to the queue.
  const addFiles = useCallback(
    async (incoming: File[]) => {
      if (phase !== 'editing' || itemState === 'applying' || isApplyingAll || incoming.length === 0) return;
      setAddError('');

      const merged: ParsedResource[] = [];
      const mergedTexts: string[] = [];
      for (const file of incoming) {
        let content: string;
        try {
          content = await file.text();
        } catch {
          setAddError(t('yamlApply.parseError', { filename: file.name }));
          return;
        }
        const result = parseYamlDocuments(file.name, content);
        if (!result.valid) {
          const message =
            result.error === 'wrong-file-type'
              ? t('yamlApply.fileTypeError')
              : result.error === 'empty-file'
                ? t('yamlApply.emptyFileError')
                : result.error === 'missing-fields'
                  ? t('yamlApply.structureError')
                  : t('yamlApply.parseError', { filename: file.name });
          setAddError(message);
          return;
        }
        merged.push(...result.resources);
        mergedTexts.push(...result.texts);
      }
      if (merged.length === 0) {
        setAddError(t('yamlApply.structureError'));
        return;
      }

      // Skip resources already in the queue (same apiVersion/kind/namespace/name), keeping each
      // kept resource paired with its source text.
      const existingIds = new Set(resources.map(resourceIdentity));
      const toAdd = merged
        .map((resource, i) => ({ resource, text: mergedTexts[i] }))
        .filter((pair) => !existingIds.has(resourceIdentity(pair.resource)));
      if (toAdd.length === 0) {
        setAddError(t('yamlApply.addDuplicate'));
        return;
      }

      const firstNewIndex = resources.length;
      setResources((prev) => [...prev, ...toAdd.map((p) => p.resource)]);
      setTexts((prev) => [...prev, ...toAdd.map((p) => p.text)]);
      setStatuses((prev) => [...prev, ...toAdd.map(() => 'pending' as ItemStatus)]);
      setIds((prev) => [...prev, ...toAdd.map(() => newId())]);
      setCurrentIndex(firstNewIndex);
    },
    [phase, itemState, isApplyingAll, resources, t, newId],
  );

  // Remove one resource from the queue, keeping ids/statuses/edits/errors aligned.
  // The last remaining resource can't be removed (the remove button is disabled) — the user closes
  // the dialog via Cancel instead, so removing never silently dismisses the whole flow.
  const removeAt = useCallback(
    (index: number) => {
      if (itemState === 'applying' || isApplyingAll || resources.length <= 1) return;
      const removedId = ids[index];
      setResources((prev) => prev.filter((_, i) => i !== index));
      setTexts((prev) => prev.filter((_, i) => i !== index));
      setStatuses((prev) => prev.filter((_, i) => i !== index));
      setIds((prev) => prev.filter((_, i) => i !== index));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[removedId];
        return next;
      });
      setItemErrors((prev) => {
        const next = { ...prev };
        delete next[removedId];
        return next;
      });
      setCurrentIndex((prev) => nextIndexAfterRemove(index, prev, resources.length));
    },
    [itemState, isApplyingAll, resources.length, ids],
  );

  // Let the drag-drop provider route files dropped onto the open dialog into this queue.
  useEffect(() => {
    if (!onRegisterAppend) return;
    onRegisterAppend((f) => void addFiles(f));
    return () => onRegisterAppend(null);
  }, [onRegisterAppend, addFiles]);

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

  const rail =
    phase === 'editing' ? (
      <div className={styles.progressPanel}>
        <div className={styles.progressHeader}>
          <Text className={styles.progressLabel}>
            {t('yamlApply.stepProgress', { current: currentIndex + 1, total: resources.length })}
          </Text>
          <ProgressIndicator
            value={progressValue}
            valueState={progressState}
            hideValue
            accessibleName={t('yamlApply.stepProgress', { current: currentIndex + 1, total: resources.length })}
          />
        </div>
        <div className={styles.railList}>
          {resources.map((r, i) => {
            const v = itemVisual(statuses[i], i === currentIndex);
            const active = i === currentIndex;
            return (
              <div
                key={ids[i]}
                className={`${styles.railRow} ${active ? styles.railRowActive : ''}`}
                data-testid={`yaml-apply-item-${i}`}
                role="button"
                tabIndex={0}
                aria-current={active ? 'true' : undefined}
                onClick={() => jumpToIndex(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    jumpToIndex(i);
                  }
                }}
              >
                <Icon name={v.icon} className={`${styles.railIcon} ${styles[`railIcon_${statuses[i]}`] ?? ''}`} />
                <div className={styles.railRowText}>
                  <Text className={styles.railRowTitle}>
                    {r.kind}/{r.metadata.name}
                  </Text>
                  {v.text && <Text className={styles.railRowStatus}>{v.text}</Text>}
                </div>
                <Button
                  design="Transparent"
                  icon="decline"
                  className={styles.railRemove}
                  disabled={itemState === 'applying' || isApplyingAll || resources.length <= 1}
                  tooltip={
                    resources.length <= 1 ? t('yamlApply.removeLastTooltip') : t('yamlApply.removeButtonTooltip')
                  }
                  data-testid={`yaml-apply-remove-${i}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(i);
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className={styles.railFooter}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".yaml,.yml"
            multiple
            style={{ display: 'none' }}
            data-testid="yaml-apply-add-input"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              void addFiles(list);
              e.target.value = '';
            }}
          />
          <Button
            design="Transparent"
            icon="add"
            disabled={itemState === 'applying' || isApplyingAll}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('yamlApply.addFileButton')}
          </Button>
        </div>
      </div>
    ) : null;

  const applyDisabled =
    itemState === 'checking' ||
    itemState === 'applying' ||
    itemState === 'unsupported' ||
    isApplyingAll ||
    dryRun.status === 'running' ||
    !validity.parseOk ||
    validity.schemaErrorCount > 0 ||
    // Hold the primary action until monaco-yaml has re-validated the latest edit (schema markers
    // lag content changes), so Apply can't fire against not-yet-validated YAML.
    !!validity.schemaStale ||
    // An existing Project can't be updated via this flow, so don't offer a known-failing action.
    (isProject && resourceExists);

  // Generic onboarding kinds have no existence check (applied via server-side applyYaml),
  // so neither 'Create' nor 'Overwrite' fits — use a neutral 'Apply'.
  const isGenericOnboarding = !isCpTarget && !!effectiveResource && !isOnboardingKind(effectiveResource.kind);
  const applyLabel = isGenericOnboarding
    ? t('yamlApply.applyButton')
    : showOverwrite
      ? t('yamlApply.overwriteButton')
      : t('yamlApply.createButton');

  const pendingCount = statuses.filter((s) => s === 'pending').length;
  const showApplyAll = phase === 'editing' && isMultiDoc && pendingCount > 1;

  // A request is in flight: block the whole dialog and show a spinner so the user can't act and
  // knows something is happening. Covers single Apply, Apply all, and Dry run.
  const isBusy = itemState === 'applying' || isApplyingAll || dryRun.status === 'running';
  const busyText = dryRun.status === 'running' ? t('yamlApply.dryRunningText') : t('yamlApply.applyingText');

  // The summary ('Apply complete') screen is always closable — the per-item working state
  // may still read 'applying' after the final successful apply advanced us here. While any request
  // is in flight (apply / apply-all / dry run) the dialog can't be closed.
  const canClose = phase === 'summary' || (!isBusy && phase !== 'parsing');

  const footer = (
    <Bar
      design="Footer"
      endContent={
        <>
          {canClose && (
            <Button design="Transparent" onClick={onClose}>
              {t(phase === 'summary' || phase === 'parse-error' ? 'yamlApply.closeButton' : 'yamlApply.cancelButton')}
            </Button>
          )}
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
              title={
                parseErrorType === 'wrong-file-type'
                  ? t('yamlApply.fileTypeError')
                  : parseErrorType === 'empty-file'
                    ? t('yamlApply.emptyFileError')
                    : t('yamlApply.parseError', { filename: parseErrorFileName })
              }
              details={
                parseErrorType === 'wrong-file-type'
                  ? t('yamlApply.parseErrorSubtitleFileType')
                  : t('yamlApply.parseErrorSubtitle')
              }
            />
            {parseErrorType === 'parse-error' && parseErrorMessage && (
              <div className={styles.parseErrorBox}>
                <div className={styles.parseErrorBoxHeader}>
                  <Icon name="error" className={styles.parseErrorBoxIcon} />
                  <span>{t('yamlApply.parseErrorDetailsTitle')}</span>
                </div>
                <div className={styles.parseErrorBoxMessage}>{parseErrorMessage}</div>
              </div>
            )}
            {parseErrorType === 'missing-fields' && (
              <Text className={styles.parseErrorHint}>{t('yamlApply.structureError')}</Text>
            )}
            <Text className={styles.parseErrorHint}>
              {parseErrorType === 'wrong-file-type'
                ? t('yamlApply.parseErrorHintFileType')
                : t('yamlApply.parseErrorHintContent')}
            </Text>
          </div>
        )}

        {phase === 'editing' && currentResource && (
          <div className={styles.editingContainer}>
            {targetBanner}

            <div className={styles.srOnly} role="status" aria-live="polite">
              {t('yamlApply.a11yProgress', {
                applied: statuses.filter((s) => s === 'applied').length,
                failed: statuses.filter((s) => s === 'failed').length,
                pending: pendingCount,
                total: resources.length,
              })}
            </div>

            {isExternalDragActive && itemState !== 'applying' && !isApplyingAll && (
              <div className={styles.addDropOverlay}>
                <Icon name="add" className={styles.addDropIcon} />
                <Text>{t('yamlApply.addDropHint')}</Text>
              </div>
            )}

            {isBusy && (
              <div className={styles.busyOverlay} data-testid="yaml-apply-busy">
                <BusyIndicator active delay={0} text={busyText} />
              </div>
            )}

            <div className={styles.editLayout}>
              {rail}

              <div className={styles.editMain}>
                {addError && (
                  <MessageStrip
                    design="Negative"
                    className={styles.strip}
                    data-testid="yaml-apply-add-error"
                    onClose={() => setAddError('')}
                  >
                    {addError}
                  </MessageStrip>
                )}

                {itemState === 'unsupported' && (
                  <MessageStrip design="Negative" hideCloseButton className={styles.strip}>
                    {itemError}
                  </MessageStrip>
                )}

                {itemState !== 'unsupported' && showOverwrite && (
                  <MessageStrip design="Critical" hideCloseButton className={styles.strip}>
                    {t('yamlApply.overwriteWarning', {
                      kind: (effectiveResource ?? currentResource).kind,
                      name: (effectiveResource ?? currentResource).metadata.name,
                    })}
                  </MessageStrip>
                )}

                {itemState !== 'unsupported' && existenceIndeterminate && (
                  <MessageStrip design="Information" hideCloseButton className={styles.strip}>
                    {t('yamlApply.existenceUnknown')}
                  </MessageStrip>
                )}

                {itemState !== 'unsupported' && isProject && resourceExists && (
                  <MessageStrip design="Information" hideCloseButton className={styles.strip}>
                    {t('yamlApply.projectExistsInfo', { name: (effectiveResource ?? currentResource).metadata.name })}
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
                    key={currentId}
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
          <div className={styles.summaryContainer}>
            {targetBanner}
            {summary.failed === 0 ? (
              <IllustratedBanner
                compact
                illustrationName={IllustrationMessageType.ReceiveAppreciation}
                subtitle={t('yamlApply.summaryAllAppliedSubtitle', { count: summary.applied })}
                title={t('yamlApply.summaryAllAppliedTitle')}
              />
            ) : (
              <MessageStrip design="Negative" hideCloseButton className={styles.strip}>
                {t('yamlApply.summaryCounts', { applied: summary.applied, failed: summary.failed })}
              </MessageStrip>
            )}
            <div className={styles.summaryList}>
              {resources.map((r, i) => {
                const applied = statuses[i] === 'applied';
                const meta = [r.apiVersion, r.metadata.namespace].filter(Boolean).join(' / ');
                return (
                  <div key={ids[i]} className={styles.summaryRow}>
                    <ObjectStatus
                      className={styles.summaryStatus}
                      state={applied ? 'Positive' : 'Negative'}
                      icon={<Icon name={applied ? 'accept' : 'error'} />}
                      inverted
                    >
                      {t(applied ? 'yamlApply.statusApplied' : 'yamlApply.statusFailed')}
                    </ObjectStatus>
                    <div className={styles.summaryRowBody}>
                      <Text className={styles.summaryRowTitle}>
                        {r.kind}/{r.metadata.name}
                      </Text>
                      {meta && <Text className={styles.summaryRowMeta}>{meta}</Text>}
                      {!applied && itemErrors[ids[i]] && (
                        <Text className={styles.summaryRowError}>{itemErrors[ids[i]]}</Text>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
