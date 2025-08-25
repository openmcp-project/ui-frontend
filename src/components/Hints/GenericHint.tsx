import React, { useState } from 'react';
import { Card, CardHeader, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { MultiPercentageBar } from './MultiPercentageBar';
import { GenericHintProps } from './types';
import { styles } from './Hints';

export const GenericHint: React.FC<GenericHintProps> = ({
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
    <div style={{ position: 'relative', width: '100%' }}>
      <Card
        header={
          <CardHeader
            additionalText={enabled ? `v${version ?? ''}` : undefined}
            avatar={
              <img
                src={config.iconSrc}
                alt={config.iconAlt}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'transparent',
                  objectFit: 'cover',
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              width: '100%',
              maxWidth: 500,
              padding: '0 1rem',
            }}
          >
            <MultiPercentageBar
              segments={hintState.segments}
              style={{ width: '100%' }}
              label={hintState.label}
              showPercentage={hintState.showPercentage}
              isHealthy={hintState.isHealthy}
              showOnlyNonZero={hintState.showOnlyNonZero ?? true}
            />
          </div>
        </div>

        {/* Hover content (e.g., RadarChart for Crossplane) */}
        {enabled &&
          hovered &&
          !isLoading &&
          !error &&
          config.renderHoverContent &&
          config.renderHoverContent(allItems, enabled)}

        {/* Activate button for disabled state */}
        {!enabled && onActivate && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 2,
              pointerEvents: 'auto',
            }}
          >
            <Button design="Emphasized" onClick={onActivate}>
              {t('Hints.common.activate')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
