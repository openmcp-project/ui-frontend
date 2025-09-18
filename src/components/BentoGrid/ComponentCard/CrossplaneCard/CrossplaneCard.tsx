import { useMemo, useState } from 'react';
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
  const [isProviderChartHovered, setIsProviderChartHovered] = useState(false);
  const [isHealthChartHovered, setIsHealthChartHovered] = useState(false);
  
  // Show labels continuously only when explicitly expanded (coupled to expansion button)
  const shouldShowLabelsAlways = expanded;

  // Fetch provider configs for distribution calculation
  const { data: providerConfigsList } = useProvidersConfigResource({
    refreshInterval: 60000,
  });

  const crossplaneState = useMemo(
    () => calculateCrossplaneSegments(allItems, isLoading, error, enabled, t),
    [allItems, isLoading, error, enabled, t],
  );

  // Calculate provider distribution for secondary bar
  const providerDistribution = useMemo(
    () => calculateProviderDistribution(allItems, providerConfigsList || []),
    [allItems, providerConfigsList],
  );

  const secondarySegments = providerDistribution.segments;

  return (
    <BaseCard
      title={t('Hints.CrossplaneHint.title')}
      subtitle={t('Hints.CrossplaneHint.subtitle')}
      iconSrc="/crossplane-icon.png"
      iconAlt="Crossplane"
      version={version}
      enabled={enabled}
      expanded={expanded}
      size={size}
      onClick={onClick}
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
          <div 
            onMouseEnter={() => setIsProviderChartHovered(true)}
            onMouseLeave={() => setIsProviderChartHovered(false)}
          >
            <MultiPercentageBar
              segments={secondarySegments.map(segment => ({
                ...segment,
                segmentLabel: `${segment.label} (${segment.count})`, // Provider name (count) - percentage handled by component
                segmentLabelColor: 'white'
              }))}
              className={styles.progressBar}
              showOnlyNonZero={true}
              barWidth={size === 'medium' ? '80%' : '90%'}
              barHeight={size === 'medium' ? '16px' : '18px'}
              barMaxWidth={size === 'medium' ? '500px' : 'none'}
              labelConfig={{
                position: 'above',
                displayMode: 'primary',
                showPercentage: false, // Don't show percentage in primary label, only in segments
                primaryLabelText: t('common.providers'),
                primaryLabelValue: providerDistribution.totalProviders,
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
              showSegmentLabelsOnHover={true} // Show segment labels only on hover
              showLabels={shouldShowLabelsAlways || isProviderChartHovered} // Show continuously when expanded/large or on hover
              minSegmentWidthForLabel={12}
            />
          </div>
        </div>

        {/* Secondary chart container - rendered below the primary chart */}
        {(size === 'medium' || size === 'large' || size === 'extra-large') && secondarySegments && (
          <div className={size === 'medium' ? styles.progressBarContainerMedium : styles.progressBarContainerLarge}>
            <div 
              onMouseEnter={() => setIsHealthChartHovered(true)}
              onMouseLeave={() => setIsHealthChartHovered(false)}
            >
              <MultiPercentageBar
                segments={crossplaneState.segments.map(segment => ({
                  ...segment,
                  segmentLabel: `${segment.label} (${segment.count})`, // Status (count) - percentage handled by component
                  segmentLabelColor: 'white'
                }))}
                className={styles.progressBar}
                showOnlyNonZero={crossplaneState.showOnlyNonZero ?? true}
                isHealthy={crossplaneState.isHealthy}
                barWidth={size === 'medium' ? '80%' : '90%'}
                barHeight={size === 'medium' ? '16px' : '18px'}
                barMaxWidth={size === 'medium' ? '500px' : 'none'}
                labelConfig={{
                  position: 'above',
                  displayMode: 'primary',
                  showPercentage: size === 'medium' ? false : crossplaneState.showPercentage, // Restore original logic
                  showCount: false,
                  primaryLabelText: 'Health',
                  primaryLabelValue: undefined,
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
                showSegmentLabelsOnHover={true}
                showLabels={shouldShowLabelsAlways || isHealthChartHovered} // Show continuously when expanded/large or on hover
                minSegmentWidthForLabel={12}
              />
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
};
