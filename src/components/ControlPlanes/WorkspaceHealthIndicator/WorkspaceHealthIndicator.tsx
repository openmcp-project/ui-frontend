import { Icon, Label } from '@ui5/webcomponents-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane';
import styles from './WorkspaceHealthIndicator.module.css';

interface Props {
  controlPlanes: ControlPlaneListItem[];
  compact?: boolean;
}

interface HealthStats {
  ready: number;
  notReady: number;
  progressing: number;
  deleting: number;
  total: number;
}

export function WorkspaceHealthIndicator({ controlPlanes, compact = false }: Props) {
  const { t } = useTranslation();

  const healthStats = useMemo<HealthStats>(() => {
    return controlPlanes.reduce(
      (acc, cp) => {
        const status = cp.status?.status ?? cp.status?.phase;
        switch (status) {
          case ReadyStatus.Ready:
            acc.ready++;
            break;
          case ReadyStatus.NotReady:
            acc.notReady++;
            break;
          case ReadyStatus.Progressing:
            acc.progressing++;
            break;
          case ReadyStatus.InDeletion:
            acc.deleting++;
            break;
        }
        acc.total++;
        return acc;
      },
      { ready: 0, notReady: 0, progressing: 0, deleting: 0, total: 0 },
    );
  }, [controlPlanes]);

  const healthPercentages = useMemo(() => {
    if (healthStats.total === 0) return { ready: 0, notReady: 0, progressing: 0 };
    return {
      ready: Math.round((healthStats.ready / healthStats.total) * 100),
      notReady: Math.round((healthStats.notReady / healthStats.total) * 100),
      progressing: Math.round((healthStats.progressing / healthStats.total) * 100),
    };
  }, [healthStats]);

  const getHealthColor = () => {
    const { ready, notReady, progressing } = healthPercentages;
    if (ready === 100) return 'var(--sapPositiveColor)';
    if (progressing > 0 && notReady === 0) return 'var(--sapInformativeColor)';
    if (notReady > 0) return 'var(--sapNegativeColor)';
    return 'var(--sapNeutralColor)';
  };

  const getHealthSummary = () => {
    if (healthStats.ready === healthStats.total) {
      return `${healthStats.ready}/${healthStats.total} ${t('WorkspaceHealthIndicator.healthy')}`;
    }
    return `${healthStats.ready}/${healthStats.total} ${t('WorkspaceHealthIndicator.healthy')}`;
  };

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <div className={styles.healthBar}>
          {healthPercentages.ready > 0 && (
            <div
              className={styles.healthBarSegment}
              style={{
                width: `${healthPercentages.ready}%`,
                background: 'var(--sapPositiveColor)',
              }}
            />
          )}
          {healthPercentages.notReady > 0 && (
            <div
              className={styles.healthBarSegment}
              style={{
                width: `${healthPercentages.notReady}%`,
                background: 'var(--sapNegativeColor)',
              }}
            />
          )}
          {healthPercentages.progressing > 0 && (
            <div
              className={styles.healthBarSegment}
              style={{
                width: `${healthPercentages.progressing}%`,
                background: 'var(--sapNeutralColor)',
              }}
            />
          )}
        </div>
        <span className={styles.healthText}>{getHealthSummary()}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Label className={styles.title}>{t('WorkspaceHealthIndicator.title')}</Label>
        <div className={`${styles.healthBadge} ${styles[getHealthColor()]}`}>
          <span className={styles.healthValue}>{healthPercentages.ready}%</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {healthStats.ready > 0 && (
          <div className={styles.statItem}>
            <Icon name="sap-icon://sys-enter" className={styles.iconReady} />
            <span className={styles.statValue}>{healthStats.ready}</span>
            <span className={styles.statLabel}>{t('WorkspaceHealthIndicator.ready')}</span>
          </div>
        )}
        {healthStats.progressing > 0 && (
          <div className={styles.statItem}>
            <Icon name="sap-icon://pending" className={styles.iconProgressing} />
            <span className={styles.statValue}>{healthStats.progressing}</span>
            <span className={styles.statLabel}>{t('WorkspaceHealthIndicator.progressing')}</span>
          </div>
        )}
        {healthStats.notReady > 0 && (
          <div className={styles.statItem}>
            <Icon name="sap-icon://error" className={styles.iconNotReady} />
            <span className={styles.statValue}>{healthStats.notReady}</span>
            <span className={styles.statLabel}>{t('WorkspaceHealthIndicator.notReady')}</span>
          </div>
        )}
        {healthStats.deleting > 0 && (
          <div className={styles.statItem}>
            <Icon name="sap-icon://delete" className={styles.iconDeleting} />
            <span className={styles.statValue}>{healthStats.deleting}</span>
            <span className={styles.statLabel}>{t('WorkspaceHealthIndicator.deleting')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
