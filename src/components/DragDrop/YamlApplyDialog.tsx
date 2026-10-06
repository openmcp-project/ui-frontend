import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';
import '@ui5/webcomponents-icons/dist/accept';
import '@ui5/webcomponents-icons/dist/alert';
import '@ui5/webcomponents-icons/dist/decline';
import '@ui5/webcomponents-icons/dist/synchronize';

import { useApolloClient } from '@apollo/client/react';
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
  Text,
} from '@ui5/webcomponents-react';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { FC, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parse, stringify } from 'yaml';
import { ApiConfig } from '../../lib/api/types/apiConfig';
import { ApiConfigProvider } from '../Shared/k8s/index.ts';
import { extractErrorMessage } from '../../lib/api/error.ts';
import { useResourcePluralNames } from '../../hooks/useResourcePluralNames.ts';
import {
  ParsedResource,
  applyOnboardingResource,
  applyCpResource,
  checkOnboardingResourceExists,
  dryRunCpResource,
  parseYamlDocuments,
} from '../../hooks/useYamlApplyResource.ts';
import { SchemaAwareEditor } from '../Yaml/YamlResourceEditorSchemaLoader.tsx';
import { IllustratedBanner } from '../Ui/IllustratedBanner/IllustratedBanner.tsx';
import styles from './YamlApplyDialog.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'parsing' | 'parse-error' | 'editing' | 'summary';
type ItemStatus = 'pending' | 'applied' | 'failed';

export interface YamlApplyDialogProps {
  file: File;
  targetApiConfig: ApiConfig | null;
  targetName: string;
  onClose: () => void;
}

function splitApiVersion(apiVersion: string): { apiGroupName: string; version: string } {
  const idx = apiVersion.lastIndexOf('/');
  if (idx === -1) return { apiGroupName: '', version: apiVersion };
  return { apiGroupName: apiVersion.slice(0, idx), version: apiVersion.slice(idx + 1) };
}

// ---------------------------------------------------------------------------
// Inner component — receives ApiConfig context
// ---------------------------------------------------------------------------

interface InnerProps extends YamlApplyDialogProps {
  isCP: boolean;
}

const YamlApplyDialogInner: FC<InnerProps> = ({ file, targetApiConfig, targetName, onClose, isCP }) => {
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const { getPluralKind, isLoading: isNamesLoading } = useResourcePluralNames();

  // ---- Phase state ----------------------------------------------------------
  const [phase, setPhase] = useState<Phase>('parsing');
  const [parseError, setParseError] = useState('');
  const [resources, setResources] = useState<ParsedResource[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ---- Per-resource results (populated during apply) -----------------------
  const [statuses, setStatuses] = useState<ItemStatus[]>([]);
  const [itemErrors, setItemErrors] = useState<(string | null)[]>([]);

  // ---- Apply flow ----------------------------------------------------------
  const [isApplying, setIsApplying] = useState(false);
  const [currentApplyingIndex, setCurrentApplyingIndex] = useState<number | null>(null);

  // ---- Edits tracking — state keyed by resource index ---------------------
  const [edits, setEdits] = useState<Record<number, string>>({});

  // ---- Summary expanded errors ---------------------------------------------
  const [expandedErrors, setExpandedErrors] = useState<Record<number, boolean>>({});

  // ---- Parse file on mount --------------------------------------------------
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseYamlDocuments(file.name, content);
      if (result.valid) {
        setResources(result.resources);
        setStatuses(Array(result.resources.length).fill('pending'));
        setItemErrors(Array(result.resources.length).fill(null));
        setPhase('editing');
      } else {
        setParseError(result.message);
        setPhase('parse-error');
      }
    };
    reader.readAsText(file);
  }, [file]);

  // ---- Content change handler — updates edits state -----------------------
  const handleContentChange = useCallback((index: number, value: string) => {
    setEdits((prev) => ({ ...prev, [index]: value }));
  }, []);

  // ---- Apply all resources --------------------------------------------------
  const doApply = useCallback(async () => {
    const count = resources.length;
    const newStatuses: ItemStatus[] = Array(count).fill('pending');
    const newErrors: (string | null)[] = Array(count).fill(null);

    setIsApplying(true);
    setStatuses([...newStatuses]);

    for (let i = 0; i < count; i++) {
      setCurrentApplyingIndex(i);
      const content = edits[i] ?? stringify(resources[i] as object);

      let resource: ParsedResource;
      try {
        resource = parse(content) as ParsedResource;
      } catch (_e) {
        newStatuses[i] = 'failed';
        newErrors[i] = t('yamlApply.invalidYaml');
        setStatuses([...newStatuses]);
        setItemErrors([...newErrors]);
        continue;
      }

      try {
        if (isCP && targetApiConfig) {
          const pluralKind = getPluralKind(resource.kind);
          if (!pluralKind) {
            newStatuses[i] = 'failed';
            newErrors[i] = t('yamlApply.unsupportedKind', { kind: resource.kind });
            setStatuses([...newStatuses]);
            setItemErrors([...newErrors]);
            continue;
          }
          await dryRunCpResource(resource, content, pluralKind, targetApiConfig);
          await applyCpResource(resource, content, pluralKind, targetApiConfig);
        } else {
          const exists = await checkOnboardingResourceExists(resource, apolloClient);
          await applyOnboardingResource(resource, exists, apolloClient, false);
        }
        newStatuses[i] = 'applied';
      } catch (e) {
        newStatuses[i] = 'failed';
        newErrors[i] = extractErrorMessage(e);
      }

      setStatuses([...newStatuses]);
      setItemErrors([...newErrors]);
    }

    setIsApplying(false);
    setCurrentApplyingIndex(null);
    setPhase('summary');
  }, [resources, edits, isCP, targetApiConfig, getPluralKind, apolloClient, t]);

  // ---- Sidebar item icon ---------------------------------------------------
  const itemIcon = (index: number): string => {
    if (index === currentApplyingIndex) return 'synchronize';
    const s = statuses[index];
    if (s === 'applied') return 'accept';
    if (s === 'failed') return 'decline';
    return 'pending';
  };

  const itemStateClass = (index: number): string => {
    const s = statuses[index];
    if (s === 'applied') return styles.sidebarItemApplied;
    if (s === 'failed') return styles.sidebarItemFailed;
    return '';
  };

  // ---- Summary stats -------------------------------------------------------
  const appliedCount = statuses.filter((s) => s === 'applied').length;
  const failedCount = statuses.filter((s) => s === 'failed').length;
  const allApplied = failedCount === 0 && appliedCount === resources.length;

  // ---- Footer button label -------------------------------------------------
  const footerButtonLabel = (): string => {
    if (isApplying) return t('yamlApply.footerApplying');
    return t('yamlApply.footerApply');
  };

  // ---- Current resource for editor -----------------------------------------
  const currentResource = resources[currentIndex];
  const { apiGroupName, version } = currentResource
    ? splitApiVersion(currentResource.apiVersion)
    : { apiGroupName: '', version: '' };

  // ---- Render ---------------------------------------------------------------
  return (
    <Dialog
      open
      headerText={t('yamlApply.dialogTitle', { name: targetName })}
      style={{ width: '80vw', maxWidth: '1100px', height: '80vh' }}
      footer={
        phase !== 'summary' && phase !== 'parse-error' ? (
          <Bar
            endContent={
              <>
                <Button design="Transparent" disabled={isApplying} onClick={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button
                  design="Emphasized"
                  disabled={isApplying || phase === 'parsing' || (isCP && isNamesLoading)}
                  onClick={doApply}
                >
                  {isApplying ? (
                    <>
                      <BusyIndicator active size="S" style={{ marginRight: '0.5rem' }} />
                      {footerButtonLabel()}
                    </>
                  ) : (
                    footerButtonLabel()
                  )}
                </Button>
              </>
            }
          />
        ) : (
          <Bar
            endContent={
              <Button design="Emphasized" onClick={onClose}>
                {t('common.close')}
              </Button>
            }
          />
        )
      }
      onClose={onClose}
    >
      <div className={styles.dialogBody}>
        {/* ── Parsing spinner ── */}
        {phase === 'parsing' && (
          <div className={styles.centeredPhase}>
            <BusyIndicator active size="M" />
            <Text>{t('yamlApply.parsing')}</Text>
          </div>
        )}

        {/* ── Parse error ── */}
        {phase === 'parse-error' && (
          <div className={styles.centeredPhase}>
            <IllustratedBanner
              illustrationName={IllustrationMessageType.SimpleError}
              title={t('yamlApply.parseErrorTitle')}
              subtitle={parseError}
              compact
            />
          </div>
        )}

        {/* ── Editor phase ── */}
        {phase === 'editing' && (
          <>
            {resources.length === 1 ? (
              /* Single-resource: full-width editor */
              <div className={styles.singlePanel}>
                <div className={styles.strips}>
                  <MessageStrip design="Information" hideCloseButton>
                    {t('yamlApply.editHint')}
                  </MessageStrip>
                </div>
                <div className={styles.editor}>
                  <SchemaAwareEditor
                    key={0}
                    kind={isCP ? currentResource?.kind : undefined}
                    apiGroupName={apiGroupName}
                    apiVersion={version}
                    yamlString={edits[0] ?? stringify(resources[0] as object)}
                    filename={file.name.replace(/\.[^.]+$/, '')}
                    onChange={(v) => handleContentChange(0, v)}
                  />
                </div>
              </div>
            ) : (
              /* Multi-resource: sidebar + editor */
              <div className={styles.twoPanel}>
                <div className={styles.sidebar}>
                  <List
                    className={styles.sidebarList}
                    selectionMode="Single"
                    onSelectionChange={(e) => {
                      const idx = Number((e.detail.selectedItems[0] as HTMLElement)?.dataset.idx ?? 0);
                      setCurrentIndex(idx);
                    }}
                  >
                    {resources.map((r, i) => (
                      <ListItemStandard
                        key={i}
                        data-idx={i}
                        selected={i === currentIndex}
                        icon={itemIcon(i)}
                        className={itemStateClass(i)}
                        text={r.metadata.name}
                        additionalText={r.kind}
                      />
                    ))}
                  </List>
                </div>
                <div className={styles.editorPanel}>
                  <div className={styles.strips}>
                    <MessageStrip design="Information" hideCloseButton>
                      {t('yamlApply.editHint')}
                    </MessageStrip>
                  </div>
                  <div className={styles.editor}>
                    <SchemaAwareEditor
                      key={currentIndex}
                      kind={isCP ? currentResource?.kind : undefined}
                      apiGroupName={apiGroupName}
                      apiVersion={version}
                      yamlString={edits[currentIndex] ?? stringify(resources[currentIndex] as object)}
                      filename={`${file.name.replace(/\.[^.]+$/, '')}_${currentIndex}`}
                      onChange={(v) => handleContentChange(currentIndex, v)}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Summary phase ── */}
        {phase === 'summary' && (
          <div className={styles.summaryBody}>
            <IllustratedBanner
              illustrationName={
                allApplied ? IllustrationMessageType.SuccessScreen : IllustrationMessageType.SimpleError
              }
              title={allApplied ? t('yamlApply.summarySuccessTitle') : t('yamlApply.summaryPartialTitle')}
              subtitle={
                allApplied
                  ? t('yamlApply.summarySuccessSubtitle', { count: appliedCount })
                  : t('yamlApply.summaryPartialSubtitle', { applied: appliedCount, failed: failedCount })
              }
              compact
            />
            <div className={styles.countRow}>
              <ObjectStatus state="Positive" showDefaultIcon>
                {t('yamlApply.summaryApplied', { count: appliedCount })}
              </ObjectStatus>
              {failedCount > 0 && (
                <ObjectStatus state="Negative" showDefaultIcon>
                  {t('yamlApply.summaryFailed', { count: failedCount })}
                </ObjectStatus>
              )}
            </div>

            {/* Failed resource details */}
            {failedCount > 0 && (
              <div className={styles.summaryList}>
                {resources.map((r, i) => {
                  if (statuses[i] !== 'failed') return null;
                  return (
                    <div key={i} className={styles.summaryErrorRow}>
                      <div
                        className={styles.summaryErrorHeader}
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedErrors((prev) => ({ ...prev, [i]: !prev[i] }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ')
                            setExpandedErrors((prev) => ({ ...prev, [i]: !prev[i] }));
                        }}
                      >
                        <Icon name="decline" className={styles.sidebarItemFailed} />
                        <Text className={styles.sidebarItemFailed}>
                          {r.kind}/{r.metadata.name}
                        </Text>
                        <Icon name={expandedErrors[i] ? 'navigation-up-arrow' : 'navigation-down-arrow'} />
                      </div>
                      {expandedErrors[i] && (
                        <div className={styles.summaryErrorDetail}>
                          <Text>{itemErrors[i] ?? t('yamlApply.unknownError')}</Text>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Public wrapper — provides ApiConfigContext for schema/plural-kind hooks
// ---------------------------------------------------------------------------

export const YamlApplyDialog: FC<YamlApplyDialogProps> = (props) => {
  const isCP = props.targetApiConfig?.mcpConfig !== undefined;
  const apiConfig = props.targetApiConfig ?? ({} as ApiConfig);

  return (
    <ApiConfigProvider apiConfig={apiConfig}>
      <YamlApplyDialogInner {...props} isCP={isCP} />
    </ApiConfigProvider>
  );
};
