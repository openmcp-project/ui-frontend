import '@ui5/webcomponents-icons/dist/edit';
import { Bar, Button, ResponsivePopover, Text } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { useGetProject } from '../../spaces/onboarding/hooks/useGetProject.ts';

interface ProjectSupportInfoPopoverProps {
  projectName: string;
  opener: string;
  open: boolean;
  onClose: () => void;
  onEditClick: () => void;
}

export function ProjectSupportInfoPopover({
  projectName,
  opener,
  open,
  onClose,
  onEditClick,
}: ProjectSupportInfoPopoverProps) {
  const { t } = useTranslation();
  const { projectData, isLoading } = useGetProject(open ? projectName : undefined);

  const landscapeLabel = projectData?.supportLandscape
    ? t(`SupportInfo.landscape.${projectData.supportLandscape}`, { defaultValue: projectData.supportLandscape })
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
      {isLoading ? (
        <div style={{ padding: '1rem' }}>
          <Text>{t('common.cannotLoadData')}</Text>
        </div>
      ) : (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
            {t('SupportInfo.popoverIntro')}
          </p>
          <InfoRow label={t('SupportInfo.purposeLabel')} value={landscapeLabel} />
          <InfoRow label={t('SupportInfo.managedRegions')} value={projectData?.supportManagedRegions} />
          <InfoRow label={t('SupportInfo.serviceIds')} value={projectData?.supportServiceIds} />
          <InfoRow label={t('SupportInfo.securityContacts')} value={projectData?.supportSecurityContacts} />
          <InfoRow label={t('SupportInfo.opsContacts')} value={projectData?.supportOpsContacts} />
        </div>
      )}
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
