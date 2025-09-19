import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseCard } from '../BaseCard/BaseCard';
import { MultiPercentageBar } from '../../MultiPercentageBar/MultiPercentageBar';
import { ManagedResourceItem } from '../../../../lib/shared/types';
import { APIError } from '../../../../lib/api/error';
import { calculateGitOpsSegments, calculateFluxResourceStatus } from './fluxCalculations';
import { useApiResource } from '../../../../lib/api/useApiResource';
import { FluxRequest } from '../../../../lib/api/types/flux/listGitRepo';
import { FluxKustomization } from '../../../../lib/api/types/flux/listKustomization';
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
}: FluxCardProps) => {
  const { t } = useTranslation();
  const [isPrimaryChartHovered, setIsPrimaryChartHovered] = useState(false);
  const [isResourceChartHovered, setIsResourceChartHovered] = useState(false);
  
  // Show labels continuously only when explicitly expanded (coupled to expansion button)
  const shouldShowLabelsAlways = expanded;

  // Fetch Flux resources for distribution calculation
  const { data: gitReposData } = useApiResource(FluxRequest, { refreshInterval: 60000 });
  const { data: kustomizationsData } = useApiResource(FluxKustomization, { refreshInterval: 60000 });

  const fluxState = useMemo(
    () => calculateGitOpsSegments(allItems, isLoading, error, enabled, t),
    [allItems, isLoading, error, enabled, t],
  );

  // Calculate Flux resource status for secondary chart
  const fluxResourceStatus = useMemo(
    () => calculateFluxResourceStatus(
      gitReposData?.items || [],
      kustomizationsData?.items || [],
      t
    ),
    [gitReposData, kustomizationsData, t],
  );

  return (
    <BaseCard
      title={t('Hints.GitOpsHint.title')}
      subtitle={t('Hints.GitOpsHint.subtitle')}
      iconSrc="/flux.png"
      iconAlt="Flux"
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
          onMouseEnter={fluxState.hasData ? () => setIsPrimaryChartHovered(true) : undefined}
          onMouseLeave={fluxState.hasData ? () => setIsPrimaryChartHovered(false) : undefined}
        >
          <MultiPercentageBar
            segments={fluxState.segments.map(segment => ({
              ...segment,
              segmentLabel: segment.percentage > 15 ? `${segment.label}${segment.count !== undefined ? ` (${segment.count})` : ''}` : (segment.count || 0) > 0 ? `${segment.count}` : '',
              segmentLabelColor: (segment.color === '#e9e9e9ff' || segment.label?.toLowerCase().includes('remaining')) ? 'black' : 'white'
            }))}
            className={styles.progressBar}
            showOnlyNonZero={fluxState.showOnlyNonZero ?? true}
            isHealthy={fluxState.isHealthy}
            barWidth={size === 'small' ? '80%' : size === 'medium' ? '80%' : '90%'}
            barHeight={size === 'small' ? '10px' : size === 'medium' ? '16px' : '18px'}
            barMaxWidth={size === 'small' ? '400px' : size === 'medium' ? '500px' : 'none'}
            labelConfig={{
              position: 'above',
              displayMode: 'primary',
              showPercentage: false,
              showCount: false,
              primaryLabelText: isLoading ? t('Hints.common.loading') : fluxState.label,
              primaryLabelValue: isLoading ? undefined : (fluxState.hasData && fluxState.segments.length > 0 ? `${fluxState.segments[0]?.percentage || 0}%` : undefined),
              hideWhenSingleFull: false,
              fontWeight: isLoading ? 'normal' : 'bold',
            }}
            animationConfig={{
              enableWave: size !== 'medium',
              enableTransitions: size !== 'medium',
              duration: size === 'medium' ? 0 : 400,
              staggerDelay: size === 'medium' ? 0 : 100,
            }}
            showSegmentLabels={false}
            showSegmentLabelsOnHover={true}
            showLabels={fluxState.hasData && (shouldShowLabelsAlways || isPrimaryChartHovered)}
            minSegmentWidthForLabel={12}
          />
        </div>

        {/* Flux Resources chart container - rendered below the primary chart */}
        {(size === 'medium' || size === 'large' || size === 'extra-large') && (
          <div 
            className={size === 'medium' ? styles.progressBarContainerMedium : styles.progressBarContainerLarge}
            onMouseEnter={fluxResourceStatus.hasData ? () => setIsResourceChartHovered(true) : undefined}
            onMouseLeave={fluxResourceStatus.hasData ? () => setIsResourceChartHovered(false) : undefined}
          >
            <MultiPercentageBar
              segments={isLoading ? 
                [{ percentage: 100, color: '#e9e9e9ff', label: t('Hints.common.loading'), segmentLabel: t('Hints.common.loading'), segmentLabelColor: 'white' }] :
                fluxResourceStatus.segments.map(segment => ({
                  ...segment,
                  segmentLabel: segment.percentage > 15 ? `${segment.label} (${segment.count || 0})` : (segment.count || 0) > 0 ? `${segment.count}` : '',
                  segmentLabelColor: 'white'
                }))
              }
              className={styles.progressBar}
              showOnlyNonZero={true}
              barWidth={size === 'medium' ? '80%' : '90%'}
              barHeight={size === 'medium' ? '16px' : '18px'}
              barMaxWidth={size === 'medium' ? '500px' : 'none'}
              labelConfig={{
                position: 'above',
                displayMode: 'primary',
                showPercentage: false,
                showCount: false,
                primaryLabelText: isLoading ? t('Hints.common.loading') : t('common.resources') || 'Resources',
                primaryLabelValue: isLoading ? undefined : (fluxResourceStatus.hasData && fluxResourceStatus.segments.length > 0 ? `${fluxResourceStatus.segments[0]?.percentage || 0}%` : undefined),
                hideWhenSingleFull: false,
                fontWeight: isLoading ? 'normal' : 'bold',
              }}
              animationConfig={{
                enableWave: size !== 'medium',
                enableTransitions: size !== 'medium',
                duration: size === 'medium' ? 0 : 400,
                staggerDelay: size === 'medium' ? 0 : 100,
              }}
              showSegmentLabels={false}
              showSegmentLabelsOnHover={true}
              showLabels={fluxResourceStatus.hasData && (shouldShowLabelsAlways || isResourceChartHovered)}
              minSegmentWidthForLabel={12}
            />
          </div>
        )}
      </div>
    </BaseCard>
  );
};
