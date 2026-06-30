import '@ui5/webcomponents-icons/dist/edit';
import { Bar, Button, ResponsivePopover } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';

export interface ProjectSupportInfo {
  supportLandscape?: string;
  supportManagedRegions?: string;
  supportServiceIds?: string;
  supportSecurityContacts?: string;
  supportOpsContacts?: string;
}

interface ProjectSupportInfoPopoverProps extends ProjectSupportInfo {
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

  const purposeLabel = supportLandscape
    ? t(`SupportInfo.landscape.${supportLandscape}`, { defaultValue: supportLandscape })
    : t('common.none');

  return (
    <ResponsivePopover
      opener={opener}
      open={open}
      placement={PopoverPlacement.Bottom}
      headerText={t('SupportInfo.popoverTitle')}
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
      style={{ minWidth: '22rem' }}
      onClose={onClose}
    >
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
          {t('SupportInfo.popoverIntro')}
        </p>
        <InfoRow label={t('SupportInfo.purposeLabel')} value={purposeLabel} />
        <InfoRow label={t('SupportInfo.managedRegions')} value={supportManagedRegions} />
        <InfoRow label={t('SupportInfo.serviceIds')} value={supportServiceIds} />
        <InfoRow label={t('SupportInfo.securityContacts')} value={supportSecurityContacts} />
        <InfoRow label={t('SupportInfo.opsContacts')} value={supportOpsContacts} />
      </div>
    </ResponsivePopover>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: value ? 'inherit' : 'var(--sapContent_NonInteractiveIconColor)' }}>
        {value || t('common.none')}
      </span>
    </div>
  );
}
