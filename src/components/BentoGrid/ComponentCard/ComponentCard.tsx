import React from 'react';
import { Card, CardHeader, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { MultiPercentageBar } from '../MultiPercentageBar/MultiPercentageBar';
import styles from './ComponentCard.module.css';
import { GenericHintProps } from '../../../types/types';

export const ComponentCard: React.FC<GenericHintProps & { 
  onClick?: () => void; 
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  secondarySegments?: Array<{ percentage: number; color: string; label: string }>;
  secondaryLabel?: string;
  expanded?: boolean;
}> = ({
  enabled = false,
  version,
  allItems = [],
  isLoading,
  error,
  config,
  onClick,
  size = 'medium',
  secondarySegments,
  secondaryLabel = 'Secondary Metric',
  expanded = false, 
}) => {
  const { t } = useTranslation();

  // Calculate segments and state using the provided calculator
  const hintState = config.calculateSegments(allItems, isLoading || false, error, enabled, t);

  return (
    <div className={styles.container}>
      <Card
        header={
          <CardHeader
            additionalText={enabled && version ? `v${version}` : undefined}
            avatar={
              <img
                src={config.iconSrc}
                alt={config.iconAlt}
                className={styles.avatar}
                style={{
                  ...config.iconStyle,
                }}
              />
            }
            titleText={config.title}
            subtitleText={size === 'small' ? undefined : config.subtitle}
            interactive={enabled}
          />
        }
        className={cx(styles.card, {
          [styles.disabled]: !enabled,
          [styles.clickable]: !!onClick && enabled,
        })}
        onClick={enabled ? onClick : undefined}

      >
        {/* Disabled overlay */}
        {!enabled && <div className={styles.disabledOverlay} />}

        {/* Expand/Collapse button */}
        {onClick && enabled && (
          <Button
            icon={expanded ? "sap-icon://collapse" : "sap-icon://expand"}
            design="Transparent"
            tooltip={expanded ? "Collapse to overview" : "Expand details"}
            style={{ zIndex: 1 }} /* Lower z-index */
            className={size === 'small' ? styles.expandButtonSmall : styles.expandButton}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          />
        )}

        <div className={
          (size === 'large' || size === 'extra-large') ? styles.contentContainerMultiple : styles.contentContainer
        }>
          <div className={
            size === 'small' ? styles.progressBarContainerSmall :
            size === 'medium' ? styles.progressBarContainerMedium :
            styles.progressBarContainerLarge
          }>
            <MultiPercentageBar
              segments={hintState.segments}
              className={styles.progressBar}
              label={hintState.label}
              showPercentage={hintState.showPercentage}
              isHealthy={hintState.isHealthy}
              showOnlyNonZero={hintState.showOnlyNonZero ?? true}
              barWidth={
                size === 'small' ? '80%' :
                size === 'medium' ? '85%' :
                '90%'
              }
              barHeight={size === 'small' ? '8px' : '12px'}
              barMaxWidth={
                size === 'small' ? '400px' :
                size === 'medium' ? '600px' :
                'none'
              }
            />
            
            {/* Second progress bar only for large and extra-large cards */}
            {(size === 'large' || size === 'extra-large') && secondarySegments && (
              <MultiPercentageBar
                segments={secondarySegments}
                className={styles.progressBar}
                label={secondaryLabel}
                showPercentage={false}
                isHealthy={false}
                showOnlyNonZero={true}
                barWidth="90%"
                barHeight="12px"
                barMaxWidth="none"
                showSegmentLabels={true}
                minSegmentWidthForLabel={12}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
