import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/headset';
import '@ui5/webcomponents-icons/dist/world';
import { Bar, Button, ResponsivePopover, Tag } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { purposeColorScheme, purposeLabel, SupportInfo } from '../../lib/supportInfo.ts';
import { SupportInfoField, SupportInfoSectionHeader } from '../Shared/SupportInfoSection.tsx';
import styles from './ProjectSupportInfoPopover.module.css';

interface ProjectSupportInfoPopoverProps extends SupportInfo {
  opener: string;
  open: boolean;
  onClose: () => void;
  onEditClick: () => void;
}

export function ProjectSupportInfoPopover({
  opener,
  open,
  onClose,
  onEditClick,
  supportLandscape,
  supportManagedRegions,
  supportServiceIds,
  supportSecurityContacts,
  supportOpsContacts,
}: ProjectSupportInfoPopoverProps) {
  const { t } = useTranslation();

  return (
    <ResponsivePopover
      opener={opener}
      open={open}
      placement={PopoverPlacement.Bottom}
      headerText={t('SupportInfo.popoverTitle')}
      className={styles.popover}
      footer={
        <Bar
          design="Footer"
          endContent={
            <Button
              design="Transparent"
              icon="edit"
              onClick={() => {
                onClose();
                onEditClick();
              }}
            >
              {t('SupportInfo.editButton')}
            </Button>
          }
        />
      }
      onClose={onClose}
    >
      <div className={styles.body}>
        <p className={styles.intro}>{t('SupportInfo.popoverIntro')}</p>
        <div className={styles.purposeRow}>
          <span className={styles.purposeLabel}>{t('SupportInfo.purposeLabel')}:</span>
          <Tag design="Set2" colorScheme={purposeColorScheme(supportLandscape)}>
            {purposeLabel(t, supportLandscape)}
          </Tag>
        </div>

        <SupportInfoSectionHeader icon="world" label={t('SupportInfo.contextSection')} />
        <SupportInfoField label={t('SupportInfo.managedRegions')} value={supportManagedRegions} indent />
        <SupportInfoField label={t('SupportInfo.serviceIds')} value={supportServiceIds} indent />

        <SupportInfoSectionHeader icon="headset" label={t('SupportInfo.contacts')} />
        <SupportInfoField label={t('SupportInfo.securityContacts')} value={supportSecurityContacts} indent />
        <SupportInfoField label={t('SupportInfo.opsContacts')} value={supportOpsContacts} indent />
      </div>
    </ResponsivePopover>
  );
}
