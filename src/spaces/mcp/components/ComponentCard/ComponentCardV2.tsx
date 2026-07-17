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
import { ReactNode, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ControlPlaneStatusCondition } from '../../../../lib/api/types/crate/controlPlanes.ts';
import { ComponentHealthPopoverButton } from './ComponentHealthPopoverButton.tsx';
import styles from './ComponentCard.module.css';

const prefixVersion = (version: string) => (version.includes('v') ? version : `v${version}`);

// Mirrors the backend's InstancePhase enum.
export enum InstancePhase {
  Pending = 'Pending',
  Progressing = 'Progressing',
  Ready = 'Ready',
  Failed = 'Failed',
  Terminating = 'Terminating',
  Unknown = 'Unknown',
}

// `(string & {})` keeps `phase` open to whatever raw string a resource actually reports (backends
// may report phases outside InstancePhase) while still surfacing the known values for autocomplete.
export type ComponentCardV2Status =
  | { kind: 'uninstalled' }
  | { kind: 'installed'; phase: InstancePhase | (string & {}) | null; conditions: ControlPlaneStatusCondition[] };

export type ComponentPhaseVisualState = 'Positive' | 'Critical' | 'Negative' | 'Neutral';

export interface ComponentPhaseVisual {
  state: ComponentPhaseVisualState;
  icon: string;
}

const PHASE_VISUALS: Record<InstancePhase, ComponentPhaseVisual> = {
  [InstancePhase.Ready]: { state: 'Positive', icon: 'sys-enter-2' },
  [InstancePhase.Pending]: { state: 'Neutral', icon: 'pending' },
  [InstancePhase.Progressing]: { state: 'Critical', icon: 'in-progress-2' },
  [InstancePhase.Failed]: { state: 'Negative', icon: 'error' },
  [InstancePhase.Terminating]: { state: 'Critical', icon: 'delete' },
  [InstancePhase.Unknown]: { state: 'Neutral', icon: 'question-mark' },
};

// A phase string the backend reports that isn't one of the known InstancePhase values (e.g. a
// future/unhandled phase) is treated as a warning rather than silently looking healthy.
const UNRECOGNIZED_PHASE_VISUAL: ComponentPhaseVisual = { state: 'Critical', icon: 'message-warning' };

export function getComponentPhaseVisual(phase: string | null): ComponentPhaseVisual {
  if (!phase) return PHASE_VISUALS[InstancePhase.Ready];
  if (phase in PHASE_VISUALS) return PHASE_VISUALS[phase as InstancePhase];
  return UNRECOGNIZED_PHASE_VISUAL;
}

export type ComponentCardV2Props = {
  name: string;
  description: string;
  logoImgSrc: string;
  status: ComponentCardV2Status;
  version?: string;
  onNavigateToComponentSection?: () => void;
  onInstallButtonClick?: () => void;
  onEditButtonClick?: () => void;
  onDeleteButtonClick?: () => void;
  yamlViewButton?: ReactNode;
};

export function ComponentCardV2({
  name,
  description,
  logoImgSrc,
  status,
  version,
  onNavigateToComponentSection,
  onInstallButtonClick,
  onEditButtonClick,
  onDeleteButtonClick,
  yamlViewButton,
}: ComponentCardV2Props) {
  const { t } = useTranslation();
  const menuRef = useRef<MenuDomRef>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isInstalled = status.kind !== 'uninstalled';
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
                {status.kind === 'installed' && (
                  <ComponentHealthPopoverButton
                    componentName={name}
                    phase={status.phase}
                    conditions={status.conditions}
                  />
                )}
              </div>
              {(hasActions || yamlViewButton) && (
                <div className={styles.actions}>
                  {yamlViewButton && (
                    // The Card has onClick={onNavigateToComponentSection} when interactive; without
                    // this bubble-phase stopPropagation, clicking the YAML button would also navigate
                    // away. This must stay a bubble-phase onClick (not onClickCapture): capture-phase
                    // stopPropagation on an ancestor would stop the event before it ever reaches the
                    // button inside, so the button's own click handler would never fire.
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- this span is an event boundary, not a new interactive control; the actual interactive element is the button it wraps
                    <span data-cy="yaml-view-button" onClick={(e) => e.stopPropagation()}>
                      {yamlViewButton}
                    </span>
                  )}
                  {hasActions && (
                    <>
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
                    </>
                  )}
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
