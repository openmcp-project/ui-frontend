import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseCard } from '../ComponentCard/BaseCard/BaseCard';
import { MultiPercentageBar } from '../MultiPercentageBar/MultiPercentageBar';
import { APIError } from '../../../lib/api/error';
import { calculateMembersSegments, MemberItem } from './membersCalculations';
import styles from './MembersCard.module.css';

interface MembersCardProps {
  allItems: MemberItem[];
  enabled: boolean;
  version?: string;
  isLoading?: boolean;
  error?: APIError;
  onClick?: () => void;
  expanded?: boolean;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
}

export const MembersCard = ({
  allItems = [],
  enabled,
  version,
  isLoading = false,
  error,
  onClick,
  expanded = false,
  size = 'medium',
}: MembersCardProps) => {
  const { t } = useTranslation();
  const [isUsersChartHovered, setIsUsersChartHovered] = useState(false);
  const [isServiceAccountsChartHovered, setIsServiceAccountsChartHovered] = useState(false);
  
  // Show labels continuously only when explicitly expanded (coupled to expansion button)
  const shouldShowLabelsAlways = expanded;

  const usersState = useMemo(
    () => calculateMembersSegments(allItems, isLoading, error, enabled, t, 'user'),
    [allItems, isLoading, error, enabled, t],
  );

  const serviceAccountsState = useMemo(
    () => calculateMembersSegments(allItems, isLoading, error, enabled, t, 'serviceaccount'),
    [allItems, isLoading, error, enabled, t],
  );

  return (
    <BaseCard
      title={t('Hints.MembersHint.title')}
      subtitle={t('Hints.MembersHint.subtitle')}
      iconSrc="/members.svg"
      iconAlt="Members"
      iconStyle={{ borderRadius: '0', width: '45px', height: '45px' }}
      version={version}
      enabled={enabled}
      expanded={expanded}
      size={size}
      onClick={onClick}
    >
      <div className={
        size === 'large' || size === 'extra-large' ? styles.contentContainerMultiple : styles.contentContainer
      }>
        {/* Users chart container */}
        <div
          className={
            size === 'small'
              ? styles.progressBarContainerSmall
              : size === 'medium'
                ? styles.progressBarContainerMedium
                : styles.progressBarContainerLarge
          }
          onMouseEnter={usersState.hasData ? () => setIsUsersChartHovered(true) : undefined}
          onMouseLeave={usersState.hasData ? () => setIsUsersChartHovered(false) : undefined}
        >
          <MultiPercentageBar
            segments={usersState.segments.map(segment => ({
              ...segment,
              segmentLabel: segment.percentage > 15 ? `${segment.label}${segment.count !== undefined ? ` (${segment.count})` : ''}` : (segment.count || 0) > 0 ? `${segment.count}` : '',
              segmentLabelColor: (segment.color === '#e9e9e9ff') ? 'black' : 'white'
            }))}
            className={styles.progressBar}
            showOnlyNonZero={usersState.showOnlyNonZero ?? true}
            isHealthy={usersState.isHealthy}
            barWidth={size === 'small' ? '80%' : size === 'medium' ? '80%' : '90%'}
            barHeight={size === 'small' ? '10px' : size === 'medium' ? '16px' : '18px'}
            barMaxWidth={size === 'small' ? '400px' : size === 'medium' ? '500px' : 'none'}
            labelConfig={{
              position: 'above',
              displayMode: 'primary',
              showPercentage: false,
              showCount: false,
              primaryLabelText: isLoading ? t('Hints.common.loading') : usersState.label,
              primaryLabelValue: isLoading ? undefined : (usersState.hasData ? usersState.totalCount : undefined),
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
            showLabels={usersState.hasData && (shouldShowLabelsAlways || isUsersChartHovered)}
            minSegmentWidthForLabel={12}
          />
        </div>

        {/* Service Accounts chart container - rendered below the users chart */}
        {(size === 'medium' || size === 'large' || size === 'extra-large') && (
          <div 
            className={size === 'medium' ? styles.progressBarContainerMedium : styles.progressBarContainerLarge}
            onMouseEnter={serviceAccountsState.hasData ? () => setIsServiceAccountsChartHovered(true) : undefined}
            onMouseLeave={serviceAccountsState.hasData ? () => setIsServiceAccountsChartHovered(false) : undefined}
          >
            <MultiPercentageBar
              segments={isLoading ? 
                [{ percentage: 100, color: '#e9e9e9ff', label: t('Hints.common.loading'), segmentLabel: t('Hints.common.loading'), segmentLabelColor: 'white' }] :
                serviceAccountsState.segments.map(segment => ({
                  ...segment,
                  segmentLabel: segment.percentage > 15 ? `${segment.label}${segment.count !== undefined ? ` (${segment.count})` : ''}` : (segment.count || 0) > 0 ? `${segment.count}` : '',
                  segmentLabelColor: (segment.color === '#e9e9e9ff') ? 'black' : 'white'
                }))
              }
              className={styles.progressBar}
              showOnlyNonZero={serviceAccountsState.showOnlyNonZero ?? true}
              isHealthy={serviceAccountsState.isHealthy}
              barWidth={size === 'medium' ? '80%' : '90%'}
              barHeight={size === 'medium' ? '16px' : '18px'}
              barMaxWidth={size === 'medium' ? '500px' : 'none'}
              labelConfig={{
                position: 'above',
                displayMode: 'primary',
                showPercentage: false,
                showCount: false,
                primaryLabelText: isLoading ? t('Hints.common.loading') : serviceAccountsState.label,
                primaryLabelValue: isLoading ? undefined : (serviceAccountsState.hasData ? serviceAccountsState.totalCount : undefined),
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
              showLabels={serviceAccountsState.hasData && (shouldShowLabelsAlways || isServiceAccountsChartHovered)}
              minSegmentWidthForLabel={12}
            />
          </div>
        )}
      </div>
    </BaseCard>
  );
};
