import '@ui5/webcomponents-icons/dist/action.js';
import '@ui5/webcomponents-icons/dist/circle-task.js';
import '@ui5/webcomponents-icons/dist/copy.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/error.js';
import '@ui5/webcomponents-icons/dist/question-mark.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-down.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import '@ui5/webcomponents-icons/dist/synchronize.js';
import '@ui5/webcomponents-icons/dist/sys-enter.js';
import {
  Button,
  ButtonDomRef,
  FlexBox,
  FlexBoxAlignItems,
  FlexBoxJustifyContent,
  Icon,
  PopoverDomRef,
  ResponsivePopover,
  Text,
} from '@ui5/webcomponents-react';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import cx from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactTimeAgo from 'react-time-ago';
import { stringify } from 'yaml';

import type { ControlPlaneCondition } from '../../spaces/onboarding/types/ControlPlane';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.ts';
import { useLink } from '../../lib/shared/useLink.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import { AnimatedHoverTextButton } from '../Helper/AnimatedHoverTextButton';
import {
  deriveControlPlaneHealth,
  HealthGroup,
  HealthLabel,
  HealthTone,
  OverallHealthState,
  ServicePhases,
} from './controlPlaneHealth.ts';
import { buildSupportTicketLink } from './supportTicketLink.ts';
import styles from './ControlPlaneStatusPopoverButton.module.css';

export interface ControlPlaneStatusPopoverButtonProps {
  phase?: string | null;
  conditions?: ControlPlaneCondition[] | null;
  deletionTimestamp?: string | null;
  services?: ServicePhases;
  projectName: string;
  workspaceName: string;
  mcpName: string;
  source: 'card' | 'detail';
  creationTimestamp?: string;
  large?: boolean;
}

const STATE_VISUAL: Record<OverallHealthState, { icon: string; className: string; labelKey: string }> = {
  ready: { icon: 'sys-enter', className: styles.toneOk, labelKey: 'ControlPlaneStatus.stateReady' },
  settingUp: { icon: 'synchronize', className: styles.toneProgress, labelKey: 'ControlPlaneStatus.stateSettingUp' },
  attention: { icon: 'error', className: styles.toneError, labelKey: 'ControlPlaneStatus.stateAttention' },
  deleting: { icon: 'delete', className: styles.toneDeleting, labelKey: 'ControlPlaneStatus.stateDeleting' },
  unknown: { icon: 'question-mark', className: styles.tonePending, labelKey: 'ControlPlaneStatus.stateUnknown' },
};

const TONE_VISUAL: Record<HealthTone, { icon: string; className: string }> = {
  ok: { icon: 'sys-enter', className: styles.toneOk },
  progress: { icon: 'synchronize', className: styles.toneProgress },
  error: { icon: 'error', className: styles.toneError },
  deleting: { icon: 'delete', className: styles.toneDeleting },
  pending: { icon: 'circle-task', className: styles.tonePending },
};

const GROUP_LABEL_KEY: Record<HealthGroup['id'], string> = {
  platform: 'ControlPlaneStatus.groupPlatform',
  cluster: 'ControlPlaneStatus.groupCluster',
  access: 'ControlPlaneStatus.groupAccess',
  services: 'ControlPlaneStatus.groupServices',
  deletion: 'ControlPlaneStatus.groupDeletion',
};

const TICKET_TITLE_KEY: Record<OverallHealthState, string> = {
  ready: 'MCPHealthPopoverButton.supportTicketTitleReady',
  settingUp: 'ControlPlaneStatus.supportTicketTitleSettingUp',
  attention: 'ControlPlaneStatus.supportTicketTitleAttention',
  deleting: 'ControlPlaneStatus.supportTicketTitleDeleting',
  unknown: 'MCPHealthPopoverButton.supportTicketTitleIssues',
};

const isValidDate = (value?: string | null): value is string => !!value && !isNaN(new Date(value).getTime());

export function ControlPlaneStatusPopoverButton({
  phase,
  conditions,
  deletionTimestamp,
  services,
  projectName,
  workspaceName,
  mcpName,
  source,
  creationTimestamp,
  large = false,
}: ControlPlaneStatusPopoverButtonProps) {
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const { githubIssuesSupportTicket } = useLink();
  const { copyToClipboard } = useCopyToClipboard();
  const popoverRef = useRef<PopoverDomRef>(null);
  const buttonRef = useRef<ButtonDomRef>(null);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const health = useMemo(
    () => deriveControlPlaneHealth({ phase, conditions, deletionTimestamp, services }),
    [phase, conditions, deletionTimestamp, services],
  );
  const stateVisual = STATE_VISUAL[health.state];
  const tl = (l: HealthLabel) => t(l.key, l.params ?? {});
  const sortedConditions = useMemo(
    () =>
      [...(conditions ?? [])].sort(
        (a, b) => Number(a.status === 'True') - Number(b.status === 'True') || a.type.localeCompare(b.type),
      ),
    [conditions],
  );

  const handleOpenerClick = (event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (!popoverRef.current) return;
    (popoverRef.current as unknown as { opener: EventTarget | null }).opener = buttonRef.current ?? event.target;
    setOpen((prev) => {
      if (!prev) telemetry.track({ category: 'controlplane', action: 'status-viewed', source });
      return !prev;
    });
  };

  const buildSummaryText = () =>
    [
      `${t('ControlPlaneStatus.summaryHeader')}: ${t(stateVisual.labelKey)} — ${tl(health.headline.label)}`,
      ...(health.headline.detail ? [health.headline.detail] : []),
      ...health.groups.flatMap((group) => [
        `- ${t(GROUP_LABEL_KEY[group.id])}: ${tl(group.summary)}`,
        ...group.items.map((item) => `  - ${tl(item.label)}${item.message ? `: ${item.message}` : ''}`),
      ]),
    ].join('\n');

  const supportTicketLink = () =>
    buildSupportTicketLink({
      baseUrl: githubIssuesSupportTicket,
      projectName,
      workspaceName,
      mcpName,
      title: t(TICKET_TITLE_KEY[health.state]),
      statusText: phase ?? '',
      conditions,
      summary: buildSummaryText(),
      t,
    });

  return (
    <div className="component-title-row">
      <AnimatedHoverTextButton
        ref={buttonRef}
        data-testid="mcp-health-button"
        icon={<Icon className={stateVisual.className} name={`sap-icon://${stateVisual.icon}`} />}
        text={t(stateVisual.labelKey)}
        textClassName={stateVisual.className}
        large={large}
        onClick={handleOpenerClick}
      />
      <ResponsivePopover
        ref={popoverRef}
        placement={PopoverPlacement.Bottom}
        className={styles.popover}
        open={open}
        footer={
          <FlexBox
            justifyContent={creationTimestamp ? FlexBoxJustifyContent.SpaceBetween : FlexBoxJustifyContent.End}
            alignItems={FlexBoxAlignItems.Center}
            className={styles.footer}
          >
            {isValidDate(creationTimestamp) && (
              <span className={styles.meta}>
                <span className={styles.metaLabel}>{t('MCPHealthPopoverButton.createdLabel')}</span>{' '}
                <ReactTimeAgo date={new Date(creationTimestamp)} />
              </span>
            )}
            <a href={supportTicketLink()} target="_blank" rel="noreferrer">
              <Button icon="action" design={health.state === 'attention' ? 'Emphasized' : 'Default'}>
                {t('MCPHealthPopoverButton.createSupportTicketButton')}
              </Button>
            </a>
          </FlexBox>
        }
        onClose={() => setOpen(false)}
      >
        {open && (
          <div className={styles.content} data-testid="cp-status-popover">
            <div className={cx(styles.headline, styles[`headline-${health.state}`])}>
              <FlexBox alignItems={FlexBoxAlignItems.Center} gap="0.5rem">
                <Icon className={stateVisual.className} name={`sap-icon://${stateVisual.icon}`} />
                <span className={cx(styles.stateLabel, stateVisual.className)} data-testid="cp-status-state">
                  {t(stateVisual.labelKey)}
                </span>
              </FlexBox>
              <Text className={styles.headlineText} data-testid="cp-status-headline">
                {tl(health.headline.label)}
              </Text>
              {health.headline.detail && (
                <Text className={styles.headlineDetail} data-testid="cp-status-headline-detail">
                  {health.headline.detail}
                </Text>
              )}
              {isValidDate(health.headline.since) && (
                <span className={styles.meta}>
                  <span className={styles.metaLabel}>{t('ControlPlaneStatus.lastChange')}</span>{' '}
                  <ReactTimeAgo date={new Date(health.headline.since)} />
                </span>
              )}
            </div>

            {health.groups.length > 0 && (
              <ul className={styles.groups}>
                {health.groups.map((group) => (
                  <li key={group.id} className={styles.group} data-testid={`cp-status-group-${group.id}`}>
                    <div className={styles.groupRow}>
                      <Icon
                        className={TONE_VISUAL[group.tone].className}
                        name={`sap-icon://${TONE_VISUAL[group.tone].icon}`}
                      />
                      <span className={styles.groupLabel}>{t(GROUP_LABEL_KEY[group.id])}</span>
                      <span className={cx(styles.groupSummary, TONE_VISUAL[group.tone].className)}>
                        {tl(group.summary)}
                      </span>
                    </div>
                    {group.items.length > 0 && (
                      <ul className={styles.items}>
                        {group.items.map((item) => (
                          <li key={item.id} className={styles.item} data-testid={`cp-status-item-${item.id}`}>
                            <div className={styles.itemRow}>
                              <Icon
                                className={cx(styles.itemIcon, TONE_VISUAL[item.tone].className)}
                                name={`sap-icon://${TONE_VISUAL[item.tone].icon}`}
                              />
                              <span className={styles.itemLabel}>{tl(item.label)}</span>
                              {item.status && <span className={styles.itemStatus}>{tl(item.status)}</span>}
                            </div>
                            {item.message && <div className={styles.itemMessage}>{item.message}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.details}>
              <button
                type="button"
                className={styles.detailsToggle}
                aria-expanded={detailsOpen}
                data-testid="cp-status-technical-details"
                onClick={() => setDetailsOpen((prev) => !prev)}
              >
                <Icon
                  className={styles.detailsChevron}
                  name={`sap-icon://${detailsOpen ? 'slim-arrow-down' : 'slim-arrow-right'}`}
                />
                <span>{t('ControlPlaneStatus.technicalDetails', { count: sortedConditions.length })}</span>
              </button>
              {detailsOpen && (
                <div className={styles.detailsBody} data-testid="cp-status-technical-details-body">
                  {sortedConditions.length === 0 ? (
                    <Text>{t('ControlPlaneStatus.noConditions')}</Text>
                  ) : (
                    <>
                      <ul className={styles.conditions}>
                        {sortedConditions.map((condition) => {
                          const ok = condition.status === 'True';
                          return (
                            <li key={condition.type} className={styles.condition}>
                              <Icon
                                className={cx(styles.conditionIcon, ok ? styles.toneOk : styles.toneError)}
                                name={`sap-icon://${ok ? 'sys-enter' : 'error'}`}
                                accessibleName={condition.status}
                              />
                              <div className={styles.conditionBody}>
                                <span className={cx(styles.conditionType, 'mono-font')}>{condition.type}</span>
                                {(condition.reason || isValidDate(condition.lastTransitionTime)) && (
                                  <span className={styles.conditionMeta}>
                                    {condition.reason}
                                    {condition.reason && isValidDate(condition.lastTransitionTime) && ' · '}
                                    {isValidDate(condition.lastTransitionTime) && (
                                      <ReactTimeAgo date={new Date(condition.lastTransitionTime)} />
                                    )}
                                  </span>
                                )}
                                {condition.message && (
                                  <span className={styles.conditionMessage}>{condition.message}</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      <Button
                        design="Transparent"
                        icon="copy"
                        onClick={() => copyToClipboard(stringify(sortedConditions, { indent: 2 }))}
                      >
                        {t('ControlPlaneStatus.copyYaml')}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </ResponsivePopover>
    </div>
  );
}
