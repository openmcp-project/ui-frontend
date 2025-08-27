import React, { useState } from 'react';
import { Card, CardHeader, MessageViewButton } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { MultiPercentageBar } from '../MultiPercentageBar/MultiPercentageBar';
import { styles } from '../HintsCardsRow';
import { HoverContent } from '../CardHoverContent/CardHoverContent';
import styles2 from './GenericHintCard.module.css';
import { GenericHintProps } from '../../../types/types';

export const GenericHintCard: React.FC<GenericHintProps> = ({
  enabled = false,
  version,
  onActivate,
  allItems = [],
  isLoading,
  error,
  config,
}) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

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
    <div className={styles2.container}>
      <Card
        header={
          <CardHeader
            additionalText={enabled ? `v${version ?? ''}` : undefined}
            avatar={
              <img
                src={config.iconSrc}
                alt={config.iconAlt}
                className={styles2.avatar}
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
        className={cx({
          [styles['disabled']]: !enabled,
        })}
        onClick={handleClick}
        onMouseEnter={enabled ? () => setHovered(true) : undefined}
        onMouseLeave={enabled ? () => setHovered(false) : undefined}
      >
        {/* Disabled overlay */}
        {!enabled && <div className={styles.disabledOverlay} />}

        <div className={styles2.contentContainer}>
          <div className={styles2.progressBarContainer}>
            <MultiPercentageBar
              segments={hintState.segments}
              className={styles2.progressBar}
              label={hintState.label}
              showPercentage={hintState.showPercentage}
              isHealthy={hintState.isHealthy}
              showOnlyNonZero={hintState.showOnlyNonZero ?? true}
            />
          </div>
        </div>

        {(() => {
          const shouldShowHoverContent = enabled && hovered && config.calculateHoverData;
          if (!shouldShowHoverContent) return null;

          const hoverData = config.calculateHoverData!(allItems, enabled, t);
          const hasValidHoverData = !!hoverData;

          return hasValidHoverData ? <HoverContent enabled={enabled} isLoading={isLoading} {...hoverData} /> : null;
        })()}

        {(() => {
          // Trigger for showing the information button when the card is disabled
          const shouldShowActivateButton = !enabled;
          if (!shouldShowActivateButton) return null;

          return (
            <div className={styles2.activateButton}>
              <MessageViewButton
                type={'Information'}
                className={cx({
                  [styles2.activateButtonClickable]: !!onActivate,
                  [styles2.activateButtonDefault]: !onActivate,
                })}
                onClick={onActivate}
              />
            </div>
          );
        })()}
      </Card>
    </div>
  );
};
