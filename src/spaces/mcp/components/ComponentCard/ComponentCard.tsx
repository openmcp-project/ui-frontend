import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/overflow';
import {
  Button,
  ButtonDomRef,
  Card,
  CardHeader,
  Menu,
  MenuDomRef,
  MenuItem,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { clsx } from 'clsx';
import { useRef, useState } from 'react';
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
  const menuRef = useRef<MenuDomRef>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const canNavigateToComponentDetails = isInstalled && !!onNavigateToComponentSection && !menuOpen;
  const prefixedVersion = version ? prefixVersion(version) : undefined;
  const hasActions = !!(onEditButtonClick || onDeleteButtonClick);

  const handleMenuOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (menuRef.current && e.currentTarget) {
      menuRef.current.opener = e.currentTarget as HTMLElement;
      setMenuOpen((prev) => !prev);
    }
  };

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
              {hasActions && (
                <div className={styles.actions}>
                  <Button
                    accessibleName={t('ComponentCard.actionsMenu')}
                    data-cy="actions-menu-button"
                    design="Transparent"
                    icon="overflow"
                    onClick={handleMenuOpenerClick}
                  />
                  <Menu
                    ref={menuRef}
                    open={menuOpen}
                    onItemClick={(event) => {
                      event.stopImmediatePropagation();
                      event.stopPropagation();
                      const action = (event.detail.item as HTMLElement).dataset.action;
                      if (action === 'edit') onEditButtonClick?.();
                      if (action === 'delete') onDeleteButtonClick?.();
                      setMenuOpen(false);
                    }}
                  >
                    {onEditButtonClick && (
                      <MenuItem
                        data-action="edit"
                        data-cy="edit-menu-item"
                        icon="edit"
                        text={t('ComponentCard.editButton')}
                      />
                    )}
                    {onDeleteButtonClick && (
                      <MenuItem
                        data-action="delete"
                        data-cy="delete-menu-item"
                        icon="delete"
                        text={t('ComponentCard.deleteButton')}
                      />
                    )}
                  </Menu>
                </div>
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
