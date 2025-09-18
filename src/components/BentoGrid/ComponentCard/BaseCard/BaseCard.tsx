import { Card, CardHeader, Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import cx from 'clsx';
import { ReactNode } from 'react';
import styles from './BaseCard.module.css';

interface BaseCardProps {
  title: string;
  subtitle?: string;
  iconSrc: string;
  iconAlt: string;
  iconStyle?: React.CSSProperties;
  version?: string;
  enabled: boolean;
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
  onClick,
  expanded = false,
  size = 'medium',
  children,
}: BaseCardProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Card
        header={
          <CardHeader
            additionalText={enabled && version ? `v${version}` : undefined}
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
            subtitleText={size === 'small' ? undefined : subtitle}
            interactive={enabled}
          />
        }
        className={cx(styles.card, {
          [styles.disabled]: !enabled,
          [styles.clickable]: !!onClick && enabled,
        })}
        onClick={enabled ? onClick : undefined}
      >
        {!enabled && <div className={styles.disabledOverlay} />}

        {onClick && enabled && (
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