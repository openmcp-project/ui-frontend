import { Button, Card, CardHeader } from '@ui5/webcomponents-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

import { Kpi, KpiProps } from '../Kpi/Kpi.tsx';
import styles from './ComponentCard.module.css';

const prefixVersion = (version: string) => (version.includes('v') ? version : `v${version}`);

export type ComponentCardProps = KpiProps & {
  name: string;
  description: string;
  logoImgSrc: string;
  isInstalled: boolean;
  version?: string;
  onNavigateToComponentSection?: () => void;
  onInstallButtonClick?: () => void;
  onEditButtonClick?: () => void;
  onDeleteButtonClick?: () => void;
};

export function ComponentCard({
  name,
  description,
  logoImgSrc,
  isInstalled,
  version,
  onNavigateToComponentSection,
  onInstallButtonClick,
  onEditButtonClick,
  onDeleteButtonClick,
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
              <div className={styles.kpiContent}>
                <Kpi {...props} />
              </div>
              <div className={styles.actions}>
                {onEditButtonClick && (
                  <Button
                    accessibleName={t('ComponentCard.editButton')}
                    data-cy="edit-button"
                    icon="sap-icon://edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditButtonClick();
                    }}
                  />
                )}
                {onDeleteButtonClick && (
                  <Button
                    accessibleName={t('ComponentCard.deleteButton')}
                    data-cy="delete-button"
                    icon="sap-icon://delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteButtonClick();
                    }}
                  />
                )}
              </div>
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
