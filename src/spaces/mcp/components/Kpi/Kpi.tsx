import { BusyIndicator, ObjectStatus, ProgressIndicator, Text } from '@ui5/webcomponents-react';

import { APIError } from '../../../../lib/api/error';

import styles from './Kpi.module.css';
import { useTranslation } from 'react-i18next';

export type KpiPropsProgress = {
  kpiType: 'progress';
  isLoading: boolean;
  error?: APIError;
  progressValue: number;
  progressLabel: string;
};

export type KpiPropsEnabled = {
  kpiType: 'enabled';
};

export type KpiProps = KpiPropsProgress | KpiPropsEnabled;

export function assertIsProgress(kpi: KpiProps): asserts kpi is KpiPropsProgress {
  if (kpi.kpiType !== 'progress') {
    throw new Error(`Assertion failed: Expected kpiType to be 'progress', but got '${kpi.kpiType}'.`);
  }
}
export function assertIsEnabled(kpi: KpiProps): asserts kpi is KpiPropsEnabled {
  if (kpi.kpiType !== 'enabled') {
    throw new Error(`Assertion failed: Expected kpiType to be 'enabled', but got '${kpi.kpiType}'.`);
  }
}

export function Kpi(props: KpiProps) {
  const { t } = useTranslation();

  switch (props.kpiType) {
    case 'progress':
      return props.error ? (
        <Text role="status">{t('Kpi.error')}</Text>
      ) : (
        <BusyIndicator active={props.isLoading} data-cy="busy-indicator">
          <div className={styles.progressContainer}>
            <Text>{props.progressLabel}</Text>
            <ProgressIndicator
              className={styles.progressIndicator}
              value={props.progressValue}
              hideValue
              data-cy="progress-indicator"
            />
          </div>
        </BusyIndicator>
      );

    case 'enabled':
      return (
        <div className={styles.enabledContainer} data-cy="enabled-container">
          <ObjectStatus state="Positive" showDefaultIcon>
            {t('Kpi.installed')}
          </ObjectStatus>
        </div>
      );
  }
}
