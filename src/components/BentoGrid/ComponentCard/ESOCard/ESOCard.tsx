import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseCard, CardState } from '../BaseCard/BaseCard';
import { MultiPercentageBar } from '../../MultiPercentageBar/MultiPercentageBar';
import { ManagedResourceItem } from '../../../../lib/shared/types';
import { APIError } from '../../../../lib/api/error';
import { calculateESOSegments } from './esoCalculations';
import styles from './ESOCard.module.css';

interface ESOCardProps {
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

export const ESOCard = ({
  allItems = [],
  enabled,
  version,
  isLoading = false,
  error,
  onClick,
  expanded = false,
  size = 'medium',
  cardState = 'coming-soon', // Default to coming-soon for ESO
}: ESOCardProps) => {
  const { t } = useTranslation();

  const esoState = useMemo(
    () => calculateESOSegments(allItems, isLoading, error, enabled, t),
    [allItems, isLoading, error, enabled, t],
  );

  // Determine title based on size
  const getTitle = () => {
    if (size === 'small') return 'ESO';
    return 'External Secrets Operator';
  };

  return (
    <BaseCard
      title={getTitle()}
      subtitle={t('Hints.ESOHint.subtitle')}
      iconSrc="/eso_light.png"
      iconAlt="ESO"
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
            segments={cardState === 'active' ? esoState.segments : [{ percentage: 100, color: '#e0e0e0', label: 'Placeholder' }]}
            className={styles.progressBar}
            showOnlyNonZero={cardState === 'active' ? (esoState.showOnlyNonZero ?? true) : false}
            isHealthy={cardState === 'active' ? esoState.isHealthy : false}
            barWidth={size === 'small' ? '80%' : size === 'medium' ? '80%' : '90%'}
            barHeight={size === 'small' ? '10px' : size === 'medium' ? '16px' : '18px'}
            barMaxWidth={size === 'small' ? '400px' : size === 'medium' ? '500px' : 'none'}
            labelConfig={{
              position: 'above',
              displayMode: 'primary',
              showPercentage: false, // Never show percentage for ESO
              showCount: false,
              primaryLabelText: 'External Secrets',
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
