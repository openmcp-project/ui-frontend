import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseCard, CardState } from '../BaseCard/BaseCard';
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
  cardState?: CardState;
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
  cardState = 'coming-soon', // Default to coming-soon for Kyverno
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
      cardState={cardState}
      expanded={expanded}
      size={size}
      onClick={cardState === 'active' ? onClick : undefined}
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
            segments={cardState === 'active' ? kyvernoState.segments : [{ percentage: 100, color: '#e0e0e0', label: 'Placeholder' }]}
            className={styles.progressBar}
            showOnlyNonZero={cardState === 'active' ? (kyvernoState.showOnlyNonZero ?? true) : false}
            isHealthy={cardState === 'active' ? kyvernoState.isHealthy : false}
            barWidth={size === 'small' ? '80%' : size === 'medium' ? '80%' : '90%'}
            barHeight={size === 'small' ? '10px' : size === 'medium' ? '16px' : '18px'}
            barMaxWidth={size === 'small' ? '400px' : size === 'medium' ? '500px' : 'none'}
            labelConfig={{
              position: 'above',
              displayMode: 'primary',
              showPercentage: false, // Never show percentage for Kyverno
              showCount: false,
              primaryLabelText: 'Policies',
              hideWhenSingleFull: false,
                fontWeight: isLoading ? 'normal' : 'bold',
            }}
            animationConfig={{
              enableWave: cardState === 'active' && size !== 'medium',
              enableTransitions: cardState === 'active' && size !== 'medium',
              duration: cardState === 'active' && size !== 'medium' ? 400 : 0,
              staggerDelay: cardState === 'active' && size !== 'medium' ? 100 : 0,
            }}
            showSegmentLabels={false}
            minSegmentWidthForLabel={12}
          />
        </div>
      </div>
    </BaseCard>
  );
};
