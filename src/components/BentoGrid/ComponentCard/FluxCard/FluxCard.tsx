import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseCard } from '../BaseCard/BaseCard';
import { MultiPercentageBar } from '../../MultiPercentageBar/MultiPercentageBar';
import { ManagedResourceItem } from '../../../../lib/shared/types';
import { APIError } from '../../../../lib/api/error';
import { calculateGitOpsSegments } from './fluxCalculations';
import styles from './FluxCard.module.css';

interface FluxCardProps {
  allItems: ManagedResourceItem[];
  enabled: boolean;
  version?: string;
  isLoading?: boolean;
  error?: APIError;
  onClick?: () => void;
  expanded?: boolean;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  secondarySegments?: { percentage: number; color: string; label: string }[];
  secondaryLabel?: string;
}

export const FluxCard = ({
  allItems = [],
  enabled,
  version,
  isLoading = false,
  error,
  onClick,
  expanded = false,
  size = 'medium',
  secondarySegments,
  secondaryLabel = 'Secondary Metric',
}: FluxCardProps) => {
  const { t } = useTranslation();

  const fluxState = useMemo(
    () => calculateGitOpsSegments(allItems, isLoading, error, enabled, t),
    [allItems, isLoading, error, enabled, t]
  );

  return (
    <BaseCard
      title={t('Hints.GitOpsHint.title')}
      subtitle={t('Hints.GitOpsHint.subtitle')}
      iconSrc="/flux.png"
      iconAlt="Flux"
      version={version}
      enabled={enabled}
      onClick={onClick}
      expanded={expanded}
      size={size}
    >
      <div
        className={
          size === 'large' || size === 'extra-large' ? styles.contentContainerMultiple : styles.contentContainer
        }
      >
        {/* Primary chart container */}
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
            segments={fluxState.segments}
            className={styles.progressBar}
            showOnlyNonZero={fluxState.showOnlyNonZero ?? true}
            isHealthy={fluxState.isHealthy}
            barWidth={size === 'small' ? '80%' : size === 'medium' ? '80%' : '90%'}
            barHeight={size === 'small' ? '10px' : size === 'medium' ? '16px' : '18px'}
            barMaxWidth={size === 'small' ? '400px' : size === 'medium' ? '500px' : 'none'}
            labelConfig={{
              position: 'above',
              displayMode: 'primary',
              showPercentage: size === 'medium' ? false : fluxState.showPercentage,
              showCount: false,
              primaryLabelText: size === 'medium' ? fluxState.label?.replace(/\s+\d+%?$/, '') || fluxState.label : fluxState.label,
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

        {/* Secondary chart container - rendered below the primary chart */}
        {(size === 'medium' || size === 'large' || size === 'extra-large') && secondarySegments && (
          <div
            className={
              size === 'medium'
                ? styles.progressBarContainerMedium
                : styles.progressBarContainerLarge
            }
          >
            <MultiPercentageBar
              segments={secondarySegments}
              className={styles.progressBar}
              showOnlyNonZero={true}
              barWidth={size === 'medium' ? '80%' : '90%'}
              barHeight={size === 'medium' ? '16px' : '18px'}
              barMaxWidth={size === 'medium' ? '500px' : 'none'}
              labelConfig={{
                position: 'above',
                displayMode: 'primary',
                showPercentage: false,
                primaryLabelText: size === 'medium' ? secondaryLabel?.replace(/\s+\d+%?$/, '') || secondaryLabel : secondaryLabel,
                hideWhenSingleFull: false,
                fontWeight: 'bold',
              }}
              animationConfig={{
                enableWave: size !== 'medium',
                enableTransitions: size !== 'medium',
                duration: size === 'medium' ? 0 : 400,
                staggerDelay: size === 'medium' ? 0 : 100,
              }}
              showSegmentLabels={secondaryLabel?.includes('Health')}
              minSegmentWidthForLabel={12}
            />
          </div>
        )}
      </div>
    </BaseCard>
  );
};