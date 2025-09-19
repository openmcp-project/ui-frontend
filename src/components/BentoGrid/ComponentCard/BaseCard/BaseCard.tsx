import { Card, CardHeader, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { ReactNode } from 'react';
import styles from './BaseCard.module.css';

type CardState = 'active' | 'inactive' | 'coming-soon';

interface BaseCardProps {
  title: string;
  subtitle?: string;
  iconSrc: string;
  iconAlt: string;
  iconStyle?: React.CSSProperties;
  version?: string;
  enabled: boolean;
  cardState?: CardState; // New prop to handle card states
  onClick?: () => void;
  expanded?: boolean;
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  children: ReactNode;
}

export const BaseCard = ({
  title,
  subtitle,
  iconSrc,
  iconAlt,
  iconStyle,
  version,
  enabled,
  cardState = 'active',
  onClick,
  expanded = false,
  size = 'medium',
  children,
}: BaseCardProps) => {
  const { t } = useTranslation();

  // Determine if card should be interactive
  const isInteractive = enabled && cardState === 'active';
  
  // Determine version display logic
  const shouldShowVersion = enabled && cardState === 'active' && version;
  const versionInSubtitle = size === 'small' && shouldShowVersion;
  const versionInAdditionalText = !versionInSubtitle && shouldShowVersion;
  
  // Determine subtitle content
  const getSubtitleContent = () => {
    if (size === 'small') {
      if (cardState === 'inactive') return t('common.inactive');
      if (cardState === 'coming-soon') return t('common.comingSoon');
      if (versionInSubtitle) return `v${version}`;
      return undefined;
    }
    return subtitle;
  };

  return (
    <div className={styles.container}>
      <Card
        header={
          <CardHeader
            additionalText={versionInAdditionalText ? `v${version}` : undefined}
            avatar={
              <img
                src={iconSrc}
                alt={iconAlt}
                className={styles.avatar}
                style={{
                  ...iconStyle,
                }}
              />
            }
            titleText={title}
            subtitleText={getSubtitleContent()}
            interactive={isInteractive}
          />
        }
        className={cx(styles.card, {
          [styles.disabled]: !enabled || cardState !== 'active',
          [styles.clickable]: !!onClick && isInteractive,
        })}
        onClick={isInteractive ? onClick : undefined}
      >
        {(!enabled || cardState !== 'active') && <div className={styles.disabledOverlay} />}

        {onClick && isInteractive && (
          <Button
            icon={expanded ? 'sap-icon://collapse' : 'sap-icon://expand'}
            design="Transparent"
            tooltip={expanded ? t('common.collapse') : t('common.expand')}
            style={{ zIndex: 1 }}
            className={size === 'small' ? styles.expandButtonSmall : styles.expandButton}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          />
        )}

        {children}
      </Card>
    </div>
  );
};

export type { CardState };
