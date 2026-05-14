import { Button, Card, CardHeader, FlexBox } from '@ui5/webcomponents-react';
import { ObjectStatus } from '@ui5/webcomponents-react/wrappers';
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
  isV2?: boolean;
  version?: string;
  onNavigateToComponentSection?: () => void;
  onInstallButtonClick?: () => void;
};

export function ComponentCard({
  name,
  description,
  logoImgSrc,
  isInstalled,
  isV2 = false,
  version,
  onNavigateToComponentSection,
  onInstallButtonClick,
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
        {isV2 && (
          <FlexBox justifyContent="Start" alignItems="End">
            {isInstalled ? (
              <ObjectStatus className={styles.status} state="Positive" showDefaultIcon>
                {t('Kpi.installed')}
              </ObjectStatus>
            ) : onInstallButtonClick ? (
              <Button className={styles.status} icon="sap-icon://add-product" onClick={onInstallButtonClick}>
                {t('ComponentCard.installButton', { component: name })}
              </Button>
            ) : null}
          </FlexBox>
        )}

        {!isV2 && (
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
        )}
      </div>
    </Card>
  );
}
