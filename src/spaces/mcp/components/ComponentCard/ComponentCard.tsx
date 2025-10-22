import { Button, Card, CardHeader } from '@ui5/webcomponents-react';
import { Kpi, KpiProps } from '../Kpi/Kpi.tsx';
import styles from './ComponentCard.module.css';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

export type ComponentCardProps = KpiProps & {
  name: string;
  description: string;
  logoImgSrc: string;
  isInstalled: boolean;
  version?: string;
  onNavigateToComponentSection?: () => void;
  onInstallButtonClick?: () => void;
};

export function ComponentCard({
  name,
  description,
  logoImgSrc,
  isInstalled,
  version,
  onNavigateToComponentSection,
  onInstallButtonClick,
  ...props
}: ComponentCardProps) {
  const { t } = useTranslation();

  const canNavigateToComponentDetails = isInstalled && !!onNavigateToComponentSection;
  const prefixedVersion = version ? `v${version}` : undefined;

  return (
    <Card
      header={
        <CardHeader
          titleText={name}
          avatar={<img alt="" className={styles.avatar} src={logoImgSrc} />}
          subtitleText={description}
          interactive={canNavigateToComponentDetails}
          additionalText={isInstalled ? prefixedVersion : t('ComponentCard.notInstalledLabel')}
        />
      }
      className={canNavigateToComponentDetails ? styles.cardInteractive : styles.cardNoninteractive}
      onClick={canNavigateToComponentDetails ? onNavigateToComponentSection : undefined}
    >
      <div
        className={clsx(
          styles.content,
          canNavigateToComponentDetails ? styles.cardInteractive : styles.cardNoninteractive,
        )}
      >
        {isInstalled ? (
          <div data-cy="kpi-container" className={styles.kpiContainer}>
            <Kpi {...props} />
          </div>
        ) : (
          <div data-cy="uninstalled-container" className={styles.uninstalledContainer}>
            {onInstallButtonClick && (
              <Button data-cy="install-button" icon="sap-icon://add-product" onClick={onInstallButtonClick}>
                {t('ComponentCard.installButton', { component: name })}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
