import { Button, Card, CardHeader } from '@ui5/webcomponents-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

import { Kpi, KpiProps } from '../Kpi/Kpi.tsx';
import styles from './ComponentCardV2.module.css';

const prefixVersion = (version: string) => (version.includes('v') ? version : `v${version}`);

export type ComponentCardProps = KpiProps & {
  name: string;
  description: string;
  logoImgSrc: string;
  isInstalled: boolean;
  isV2?: boolean;
  version?: string;
  onNavigateToComponentSection?: () => void;
  onInstallButtonClick?: () => void;
  onEditButtonClick?: () => void;
};

export function ComponentCardV2({
  name,
  description,
  logoImgSrc,
  isInstalled,
  isV2: _isV2,
  version,
  onNavigateToComponentSection,
  onInstallButtonClick,
  onEditButtonClick,
  ...props
}: ComponentCardProps) {
  const { t } = useTranslation();

  const canNavigateToComponentDetails = isInstalled && !!onNavigateToComponentSection;
  const prefixedVersion = version ? prefixVersion(version) : undefined;

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
      <div className={styles.cardContent}>
        <div
          className={clsx(
            styles.content,
            canNavigateToComponentDetails ? styles.cardInteractive : styles.cardNoninteractive,
          )}
        >
          {isInstalled ? (
            <div data-cy="kpi-container" className={styles.kpiContainer}>
              <Kpi {...props} />
              {onEditButtonClick && (
                <Button
                  data-cy="edit-button"
                  icon="sap-icon://edit"
                  aria-label={t('ComponentCard.editButton')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditButtonClick();
                  }}
                />
              )}
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
      </div>
    </Card>
  );
}
