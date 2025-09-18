import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseCard } from '../BaseCard/BaseCard';
import { MultiPercentageBar } from '../../MultiPercentageBar/MultiPercentageBar';
import { ManagedResourceItem } from '../../../../lib/shared/types';
import { APIError } from '../../../../lib/api/error';
import { calculateCrossplaneSegments, calculateProviderDistribution } from './crossplaneCalculations';
import { useProvidersConfigResource } from '../../../../lib/api/useApiResource';
import styles from './CrossplaneCard.module.css';

interface CrossplaneCardProps {
  allItems: ManagedResourceItem[];
  enabled: boolean;
  version?: string;
  isLoading?: boolean;
  error?: APIError;
  onClick?: () => void;
  expanded?: boolean;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
}

export const CrossplaneCard = ({
  allItems = [],
  enabled,
  version,
  isLoading = false,
  error,
  onClick,
  expanded = false,
  size = 'medium',
}: CrossplaneCardProps) => {
  const { t } = useTranslation();

  // Fetch provider configs for distribution calculation
  const { data: providerConfigsList } = useProvidersConfigResource({
    refreshInterval: 60000,
  });

  const crossplaneState = useMemo(
    () => calculateCrossplaneSegments(allItems, isLoading, error, enabled, t),
    [allItems, isLoading, error, enabled, t]
  );

  // Calculate provider distribution for secondary bar
  const providerDistribution = useMemo(
    () => calculateProviderDistribution(allItems, providerConfigsList || []),
    [allItems, providerConfigsList],
  );

  const secondarySegments = providerDistribution.segments;
  const secondaryLabel = `${t('common.providers')} ${providerDistribution.totalProviders}`;

  return (
    <BaseCard
      title={t('Hints.CrossplaneHint.title')}
      subtitle={t('Hints.CrossplaneHint.subtitle')}
      iconSrc="/crossplane-icon.png"
      iconAlt="Crossplane"
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
            segments={crossplaneState.segments}
            className={styles.progressBar}
            showOnlyNonZero={crossplaneState.showOnlyNonZero ?? true}
            isHealthy={crossplaneState.isHealthy}
            barWidth={size === 'small' ? '80%' : size === 'medium' ? '80%' : '90%'}
            barHeight={size === 'small' ? '10px' : size === 'medium' ? '16px' : '18px'}
            barMaxWidth={size === 'small' ? '400px' : size === 'medium' ? '500px' : 'none'}
            labelConfig={{
              position: 'above',
              displayMode: 'primary',
              showPercentage: size === 'medium' ? false : crossplaneState.showPercentage,
              showCount: false,
              primaryLabelText: size === 'medium' ? crossplaneState.label?.replace(/\s+\d+%?$/, '') || crossplaneState.label : crossplaneState.label,
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
              showSegmentLabels={secondaryLabel?.includes('Providers')}
              minSegmentWidthForLabel={12}
            />
          </div>
        )}
      </div>
    </BaseCard>
  );
};