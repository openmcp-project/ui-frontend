import '@ui5/webcomponents-icons/dist/edit';
import '@ui5/webcomponents-icons/dist/headset';
import '@ui5/webcomponents-icons/dist/world';
import { Bar, Button, MessageStrip, ResponsivePopover, Tag } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { purposeColorScheme, purposeLabel, SupportInfo, SupportInfoSource } from '../../lib/supportInfo.ts';
import { SupportInfoListField, SupportInfoSectionHeader } from '../Shared/SupportInfoSection.tsx';
import { InheritedFromText } from '../Shared/InheritedFromText.tsx';
import styles from './ProjectSupportInfoPopover.module.css';

interface ProjectSupportInfoPopoverProps extends SupportInfo {
  opener: string;
  open: boolean;
  inheritedFrom?: SupportInfoSource;
  onClose: () => void;
  onEditClick: () => void;
}

export function ProjectSupportInfoPopover({
  opener,
  open,
  inheritedFrom,
  onClose,
  onEditClick,
  supportLandscape,
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
              data-testid="support-info-edit-button"
              design="Transparent"
              icon="edit"
              onClick={() => {
                onClose();
                onEditClick();
              }}
            >
              {inheritedFrom ? t('SupportInfo.overrideButton') : t('SupportInfo.editButton')}
            </Button>
          }
        />
      }
      onClose={onClose}
    >
      <div className={styles.body}>
        <p className={styles.intro}>{t('SupportInfo.popoverIntro')}</p>
        {inheritedFrom && (
          <MessageStrip data-testid="support-info-inherited-from" design="Information" hideCloseButton>
            <InheritedFromText source={inheritedFrom} />
          </MessageStrip>
        )}
        <div className={styles.purposeRow}>
          <span className={styles.purposeLabel}>{t('SupportInfo.purposeLabel')}:</span>
          <Tag design="Set2" colorScheme={purposeColorScheme(supportLandscape)}>
            {purposeLabel(t, supportLandscape)}
          </Tag>
        </div>

        <SupportInfoSectionHeader icon="world" label={t('SupportInfo.contextSection')} />
        <SupportInfoListField label={t('SupportInfo.serviceIds')} value={supportServiceIds} indent />

        <SupportInfoSectionHeader icon="headset" label={t('SupportInfo.contacts')} />
        <SupportInfoListField label={t('SupportInfo.securityContacts')} value={supportSecurityContacts} indent />
        <SupportInfoListField label={t('SupportInfo.opsContacts')} value={supportOpsContacts} indent />
      </div>
    </ResponsivePopover>
  );
}
