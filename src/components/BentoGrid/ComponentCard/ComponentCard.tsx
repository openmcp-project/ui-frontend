import React from 'react';
import { Card, CardHeader, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { MultiPercentageBar } from '../MultiPercentageBar/MultiPercentageBar';
import styles from './ComponentCard.module.css';
import { GenericHintProps } from '../../../types/types';

export const ComponentCard: React.FC<GenericHintProps & { onClick?: () => void; size?: 'small' | 'medium' | 'large' | 'extra-large' }> = ({
  enabled = false,
  version,
  allItems = [],
  isLoading,
  error,
  config,
  onClick,
  size = 'medium',
}) => {
  const { t } = useTranslation();

  // Calculate segments and state using the provided calculator
  const hintState = config.calculateSegments(allItems, isLoading || false, error, enabled, t);

  return (
    <div className={styles.container}>
      <Card
        header={
          <CardHeader
            additionalText={enabled ? `${version ?? ''}` : undefined}
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
          [styles.clickable]: !!onClick,
        })}
        onClick={onClick}
      >
        {/* Disabled overlay */}
        {!enabled && <div className={styles.disabledOverlay} />}

        {/* Expand button */}
        {onClick && (
          <Button
            icon="sap-icon://expand"
            design="Transparent"
            className={size === 'small' ? styles.expandButtonSmall : styles.expandButton}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          />
        )}

        <div className={styles.contentContainer}>
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
          </div>
        </div>
      </Card>
    </div>
  );
};
