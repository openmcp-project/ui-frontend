import '@ui5/webcomponents-icons/dist/arrow-top.js';
import '@ui5/webcomponents-icons/dist/error.js';
import { Icon } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import type { VersionDiff } from '../../../utils/componentsVersions.ts';
import { formatCompactDurationSince } from '../../../utils/i18n/compactDuration.ts';
import { getServiceLifecycle, type ServiceLifecycle } from './serviceLifecycleIndicator.ts';
import styles from './ServiceIcon.module.css';

interface ServiceIconProps {
  name: string;
  logo: string;
  /** Raw V2 `status.phase`; omit for V1 services (always rendered as the plain logo). */
  phase?: string | null;
  /**
   * V2 only: message from a failing `Ready` condition (e.g. `ReconcileError`). When present the icon
   * shows a bold error badge and the full message in its tooltip — this overrides the phase state.
   */
  errorMessage?: string | null;
  /**
   * V2 only: ISO timestamp since the service began benignly reconciling. When set and the service is
   * installing, the tooltip reads "Reconciling for {duration}" (e.g. "Reconciling for 2h").
   */
  reconcilingSince?: string | null;
  /** V2 only: when a newer catalog version exists, its semver bump severity. */
  updateDiff?: VersionDiff | null;
  /** V1 services have no lifecycle telemetry; render the plain logo like before. */
  lifecycleEnabled?: boolean;
  onClick: () => void;
  title: string;
}

const LIFECYCLE_CLASS: Record<Exclude<ServiceLifecycle, 'ready'>, string> = {
  installing: styles.installing,
  deleting: styles.deleting,
  error: styles.error,
  unknown: styles.unknown,
};

const LIFECYCLE_LABEL_KEY: Record<ServiceLifecycle, string> = {
  installing: 'ControlPlaneCard.serviceInstalling',
  deleting: 'ControlPlaneCard.serviceDeleting',
  ready: 'ControlPlaneCard.serviceReady',
  error: 'ControlPlaneCard.serviceError',
  unknown: 'ControlPlaneCard.serviceUnknown',
};

/**
 * A control-plane service icon that encodes its lifecycle through motion rather
 * than a tiny corner badge. The real full-color logo is always the subject; the
 * state is carried by how it moves:
 *
 * - ready      → the untouched, full-color logo, static (when an update is
 *   available it keeps the corner severity badge — no animation).
 * - installing → the logo fades in from nothing, snaps back, and fades in again
 *   — a looping sawtooth that reads as "appearing". Its tooltip shows how long it
 *   has been reconciling without issues (e.g. "Reconciling for 2h").
 * - deleting   → the logo fades out to nothing, snaps back to full, and fades
 *   out again behind a restrained red destructive wash — it reads as
 *   "disappearing".
 * - error      → the logo sits static and untouched; a bold red alert badge in
 *   the corner plus a red tile border flag it, and the hover tooltip carries the
 *   full, user-actionable message.
 * - unknown    → the logo breathes quietly in place while it awaits a phase.
 */
export function ServiceIcon({
  name,
  logo,
  phase,
  errorMessage,
  reconcilingSince,
  updateDiff,
  lifecycleEnabled = false,
  onClick,
  title,
}: ServiceIconProps) {
  const { t } = useTranslation();
  const lifecycle: ServiceLifecycle = lifecycleEnabled ? getServiceLifecycle(phase, errorMessage) : 'ready';
  const isReady = lifecycle === 'ready';
  const isError = lifecycle === 'error';
  // A hard error supersedes the update hint — fix the error first.
  const showUpdateBadge =
    !!updateDiff && lifecycle !== 'installing' && lifecycle !== 'deleting' && lifecycle !== 'error';

  const stateClass = isReady ? '' : LIFECYCLE_CLASS[lifecycle];

  // Error tooltip = the full actionable message; installing tooltip = how long it has been
  // reconciling without issues ("Reconciling for 2h"); otherwise just the service name.
  const reconcilingFor = lifecycle === 'installing' ? formatCompactDurationSince(reconcilingSince) : '';
  const tooltip = isError
    ? errorMessage?.trim() || `${title} — ${t(LIFECYCLE_LABEL_KEY.error)}`
    : reconcilingFor
      ? t('ControlPlaneCard.reconcilingFor', { duration: reconcilingFor })
      : title;

  return (
    <button
      className={`${styles.icon} ${stateClass}`}
      title={tooltip}
      data-testid={`component-icon-${name}`}
      data-lifecycle={lifecycle}
      aria-label={isReady ? title : `${title} — ${t(LIFECYCLE_LABEL_KEY[lifecycle])}`}
      onClick={onClick}
    >
      <span className={styles.stage}>
        <img src={logo} alt="" aria-hidden className={styles.logo} />
      </span>

      {!isReady && (
        <span className={styles.srOnly} data-testid={`service-status-${name}`}>
          {isError && errorMessage?.trim() ? errorMessage.trim() : t(LIFECYCLE_LABEL_KEY[lifecycle])}
        </span>
      )}

      {isError && (
        <Icon name="error" className={styles.errorBadge} accessibleName={t(LIFECYCLE_LABEL_KEY.error)} showTooltip />
      )}

      {showUpdateBadge && (
        <Icon
          name="arrow-top"
          className={
            updateDiff === 'major'
              ? styles.updateBadgeMajor
              : updateDiff === 'minor'
                ? styles.updateBadgeMinor
                : styles.updateBadgePatch
          }
          accessibleName={t('ControlPlaneCard.updatesAvailable')}
          showTooltip
        />
      )}
    </button>
  );
}
