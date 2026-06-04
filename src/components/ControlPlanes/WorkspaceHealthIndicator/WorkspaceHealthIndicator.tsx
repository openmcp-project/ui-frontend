import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane';
import styles from './WorkspaceHealthIndicator.module.css';

interface Props {
  controlPlanes: ControlPlaneListItem[];
}

interface HealthStats {
  ready: number;
  notReady: number;
  progressing: number;
  deleting: number;
  total: number;
}

function getSegmentColor(status: string): string {
  switch (status) {
    case ReadyStatus.Ready:
      return 'var(--sapPositiveColor)';
    case ReadyStatus.NotReady:
      return 'var(--sapNegativeColor)';
    case ReadyStatus.Progressing:
      return 'var(--sapInformativeColor)';
    case ReadyStatus.InDeletion:
      return 'var(--sapCriticalColor)';
    default:
      return 'var(--sapNeutralColor)';
  }
}

export function WorkspaceHealthIndicator({ controlPlanes }: Props) {
  const { t } = useTranslation();

  const stats = useMemo<HealthStats>(() => {
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

  const MAX_PILLS = 5;
  type Segment = { color: string; count: number };
  const segments: Segment[] = [];

  const addSegment = (count: number, status: string) => {
    if (count === 0) return;
    const pills = stats.total <= MAX_PILLS ? count : Math.max(1, Math.round((count / stats.total) * MAX_PILLS));
    segments.push({ color: getSegmentColor(status), count: pills });
  };

  addSegment(stats.ready, ReadyStatus.Ready);
  addSegment(stats.notReady, ReadyStatus.NotReady);
  addSegment(stats.progressing, ReadyStatus.Progressing);
  addSegment(stats.deleting, ReadyStatus.InDeletion);

  if (stats.total > MAX_PILLS) {
    const pillTotal = segments.reduce((s, seg) => s + seg.count, 0);
    if (pillTotal !== MAX_PILLS && segments.length > 0) {
      const largest = segments.reduce((a, b) => (a.count >= b.count ? a : b));
      largest.count += MAX_PILLS - pillTotal;
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.pillBar}>
        {segments.map((seg, i) =>
          Array.from({ length: seg.count }).map((_, j) => (
            <div
              key={`${i}-${j}`}
              className={styles.pill}
              data-testid="health-pill"
              style={{ background: seg.color }}
            />
          )),
        )}
      </div>
      <div className={styles.summary}>
        {stats.ready > 0 && (
          <span className={styles.summaryItem}>
            <span className={styles.dot} style={{ background: 'var(--sapPositiveColor)' }} />
            {stats.ready} {t('WorkspaceHealthIndicator.ready')}
          </span>
        )}
        {stats.notReady > 0 && (
          <span className={styles.summaryItem}>
            <span className={styles.dot} style={{ background: 'var(--sapNegativeColor)' }} />
            {stats.notReady} {t('WorkspaceHealthIndicator.notReady')}
          </span>
        )}
        {stats.progressing > 0 && (
          <span className={styles.summaryItem}>
            <span className={styles.dot} style={{ background: 'var(--sapInformativeColor)' }} />
            {stats.progressing} {t('WorkspaceHealthIndicator.progressing')}
          </span>
        )}
        {stats.deleting > 0 && (
          <span className={styles.summaryItem}>
            <span className={styles.dot} style={{ background: 'var(--sapCriticalColor)' }} />
            {stats.deleting} {t('WorkspaceHealthIndicator.deleting')}
          </span>
        )}
      </div>
    </div>
  );
}
