import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseCard } from '../BaseCard/BaseCard';
import { MultiPercentageBar } from '../../MultiPercentageBar/MultiPercentageBar';
import { ManagedResourceItem } from '../../../../lib/shared/types';
import { APIError } from '../../../../lib/api/error';
import { calculateKyvernoSegments } from './kyvernoCalculations';
import styles from './KyvernoCard.module.css';

interface KyvernoCardProps {
  allItems: ManagedResourceItem[];
  enabled: boolean;
  version?: string;
  isLoading?: boolean;
  error?: APIError;
  onClick?: () => void;
  expanded?: boolean;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
}

export const KyvernoCard = ({
  allItems = [],
  enabled,
  version,
  isLoading = false,
  error,
  onClick,
  expanded = false,
  size = 'medium',
}: KyvernoCardProps) => {
  const { t } = useTranslation();

  const kyvernoState = useMemo(
    () => calculateKyvernoSegments(allItems, isLoading, error, enabled, t),
    [allItems, isLoading, error, enabled, t],
  );

  return (
    <BaseCard
      title={t('Hints.KyvernoHint.title')}
      subtitle={t('Hints.KyvernoHint.subtitle')}
      iconSrc="/kyverno.svg"
      iconAlt="Kyverno"
      iconStyle={{ borderRadius: '0' }}
      version={version}
      enabled={enabled}
      expanded={expanded}
      size={size}
      onClick={onClick}
    >
      <div className={styles.contentContainer}>
        <div
          className={
            size === 'small'
              ? styles.progressBarContainerSmall
              : size === 'medium'
                ? styles.progressBarContainerMedium
                : styles.progressBarContainerLarge
          }
        >
          <MultiPercentageBar
            segments={kyvernoState.segments}
            className={styles.progressBar}
            showOnlyNonZero={kyvernoState.showOnlyNonZero ?? true}
            isHealthy={kyvernoState.isHealthy}
            barWidth={size === 'small' ? '80%' : size === 'medium' ? '80%' : '90%'}
            barHeight={size === 'small' ? '10px' : size === 'medium' ? '16px' : '18px'}
            barMaxWidth={size === 'small' ? '400px' : size === 'medium' ? '500px' : 'none'}
            labelConfig={{
              position: 'above',
              displayMode: 'primary',
              showPercentage: size === 'medium' ? false : kyvernoState.showPercentage,
              showCount: false,
              primaryLabelText:
                size === 'medium'
                  ? kyvernoState.label?.replace(/\s+\d+%?$/, '') || kyvernoState.label
                  : kyvernoState.label,
              hideWhenSingleFull: false,
              fontWeight: 'bold',
            }}
            animationConfig={{
              enableWave: size !== 'medium',
              enableTransitions: size !== 'medium',
              duration: size === 'medium' ? 0 : 400,
              staggerDelay: size === 'medium' ? 0 : 100,
            }}
            showSegmentLabels={false}
            minSegmentWidthForLabel={12}
          />
        </div>
      </div>
    </BaseCard>
  );
};
