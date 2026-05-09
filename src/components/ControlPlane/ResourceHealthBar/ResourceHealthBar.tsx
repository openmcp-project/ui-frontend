import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ResourceHealthBar.module.css';

interface ResourceStatus {
  ready?: boolean;
  synced?: boolean;
  installed?: boolean;
  healthy?: boolean;
}

interface Props {
  resources: ResourceStatus[];
  type?: 'ready-synced' | 'installed-healthy';
}

interface HealthStats {
  good: number;
  bad: number;
  unknown: number;
  total: number;
}

export function ResourceHealthBar({ resources, type = 'ready-synced' }: Props) {
  const { t } = useTranslation();

  const healthStats = useMemo<HealthStats>(() => {
    return resources.reduce(
      (acc, resource) => {
        if (type === 'installed-healthy') {
          // For Providers: installed + healthy
          const isInstalled = resource.installed === true;
          const isHealthy = resource.healthy === true;

          if (!isInstalled) {
            acc.unknown++;
          } else if (isHealthy) {
            acc.good++;
          } else {
            acc.bad++;
          }
        } else {
          // For Managed Resources: ready + synced
          const isReady = resource.ready === true;
          const isSynced = resource.synced === true;

          if (isReady && isSynced) {
            acc.good++;
          } else if (isReady === false || isSynced === false) {
            acc.bad++;
          } else {
            acc.unknown++;
          }
        }

        acc.total++;
        return acc;
      },
      { good: 0, bad: 0, unknown: 0, total: 0 },
    );
  }, [resources, type]);

  const goodPercent = healthStats.total > 0 ? (healthStats.good / healthStats.total) * 100 : 0;
  const badPercent = healthStats.total > 0 ? (healthStats.bad / healthStats.total) * 100 : 0;
  const unknownPercent = healthStats.total > 0 ? (healthStats.unknown / healthStats.total) * 100 : 0;

  const goodLabel = type === 'installed-healthy' ? t('common.healthy') : t('common.ready');
  const badLabel = type === 'installed-healthy' ? t('errors.notHealthy') : t('errors.notReady');
  const unknownLabel = type === 'installed-healthy' ? t('common.notInstalled', 'Not Installed') : t('common.unknown');

  return (
    <div className={styles.healthBar}>
      {healthStats.good > 0 && (
        <div
          className={styles.goodSegment}
          style={{ width: `${goodPercent}%` }}
          title={`${healthStats.good} ${goodLabel}`}
        />
      )}
      {healthStats.bad > 0 && (
        <div
          className={styles.badSegment}
          style={{ width: `${badPercent}%` }}
          title={`${healthStats.bad} ${badLabel}`}
        />
      )}
      {healthStats.unknown > 0 && (
        <div
          className={styles.unknownSegment}
          style={{ width: `${unknownPercent}%` }}
          title={`${healthStats.unknown} ${unknownLabel}`}
        />
      )}
    </div>
  );
}
