import { useMemo } from 'react';
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

  const membersState = useMemo(
    () => calculateMembersSegments(allItems, isLoading, error, enabled, t),
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
            segments={membersState.segments}
            className={styles.progressBar}
            showOnlyNonZero={membersState.showOnlyNonZero ?? true}
            isHealthy={membersState.isHealthy}
            barWidth={size === 'small' ? '80%' : size === 'medium' ? '80%' : '90%'}
            barHeight={size === 'small' ? '10px' : size === 'medium' ? '16px' : '18px'}
            barMaxWidth={size === 'small' ? '400px' : size === 'medium' ? '500px' : 'none'}
            labelConfig={{
              position: 'above',
              displayMode: 'primary',
              showPercentage: size === 'medium' ? false : membersState.showPercentage,
              showCount: false,
              primaryLabelText:
                size === 'medium'
                  ? membersState.label?.replace(/\s+\d+%?$/, '') || membersState.label
                  : membersState.label,
              hideWhenSingleFull: false,
              fontWeight: 'bold',
            }}
            animationConfig={{
              enableWave: size !== 'medium',
              enableTransitions: size !== 'medium',
              duration: size === 'medium' ? 0 : 400,
              staggerDelay: size === 'medium' ? 0 : 100,
            }}
            showSegmentLabels={membersState.label?.includes('Users')}
            minSegmentWidthForLabel={12}
          />
        </div>
      </div>
    </BaseCard>
  );
};
