import React from 'react';
import { Card, CardHeader } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { MultiPercentageBar } from '../MultiPercentageBar/MultiPercentageBar';
import styles from './ComponentCard.module.css';
import { GenericHintProps } from '../../../types/types';

export const ComponentCard: React.FC<GenericHintProps> = ({
  enabled = false,
  version,
  allItems = [],
  isLoading,
  error,
  config,
}) => {
  const { t } = useTranslation();

  // Calculate segments and state using the provided calculator
  const hintState = config.calculateSegments(allItems, isLoading || false, error, enabled, t);

  // Handle click navigation if scroll target is provided
  const handleClick =
    enabled && config.scrollTarget
      ? () => {
          const el = document.querySelector(config.scrollTarget!);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      : undefined;

  return (
    <div className={styles.container}>
      <Card
        header={
          <CardHeader
            additionalText={enabled ? `v${version ?? ''}` : undefined}
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
            subtitleText={config.subtitle}
            interactive={enabled}
          />
        }
        className={cx(styles.card, {
          [styles.disabled]: !enabled,
        })}
        onClick={handleClick}
      >
        {/* Disabled overlay */}
        {!enabled && <div className={styles.disabledOverlay} />}

        <div className={styles.contentContainer}>
          <div className={styles.progressBarContainer}>
            <MultiPercentageBar
              segments={hintState.segments}
              className={styles.progressBar}
              label={hintState.label}
              showPercentage={hintState.showPercentage}
              isHealthy={hintState.isHealthy}
              showOnlyNonZero={hintState.showOnlyNonZero ?? true}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
