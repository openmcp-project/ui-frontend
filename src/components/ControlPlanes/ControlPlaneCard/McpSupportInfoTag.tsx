import { Tag } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { purposeColorScheme, purposeLabel, SupportInfo } from '../../../lib/supportInfo.ts';
import { ProjectSupportInfoPopover } from '../../Projects/ProjectSupportInfoPopover.tsx';
import { HoverRevealTag } from '../../Ui/HoverRevealTag/HoverRevealTag.tsx';
import { EditControlPlaneV2WizardDataLoader } from '../../Wizards/CreateControlPlaneV2/EditControlPlaneV2WizardDataLoader.tsx';
import styles from './ControlPlaneCard.module.css';

interface Props {
  namespace: string;
  resourceName: string;
  supportInfo: SupportInfo;
}

export function McpSupportInfoTag({ namespace, resourceName, supportInfo }: Props) {
  const { t } = useTranslation();
  const { supportLandscape, supportServiceIds, supportSecurityContacts, supportOpsContacts } = supportInfo;
  const openerId = useId();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!supportLandscape) {
    return (
      <>
        <HoverRevealTag
          delay={50}
          className={styles.supportTag}
          colorScheme={purposeColorScheme(undefined)}
          copy={t('SupportInfo.addButton')}
          design="Set2"
          id={openerId}
          onClick={() => setEditOpen(true)}
        />
        {editOpen && (
          <EditControlPlaneV2WizardDataLoader
            isOpen={editOpen}
            setIsOpen={setEditOpen}
            namespace={namespace}
            resourceName={resourceName}
            initialSection="supportInfo"
          />
        )}
      </>
    );
  }

  return (
    <>
      <Tag
        id={openerId}
        interactive
        design="Set2"
        colorScheme={purposeColorScheme(supportLandscape)}
        className={styles.supportTag}
        data-testid="mcp-support-info-tag"
        onClick={() => setPopoverOpen(true)}
      >
        {purposeLabel(t, supportLandscape)}
      </Tag>
      {popoverOpen && (
        <ProjectSupportInfoPopover
          opener={openerId}
          open={popoverOpen}
          supportLandscape={supportLandscape}
          supportServiceIds={supportServiceIds}
          supportSecurityContacts={supportSecurityContacts}
          supportOpsContacts={supportOpsContacts}
          onClose={() => setPopoverOpen(false)}
          onEditClick={() => setEditOpen(true)}
        />
      )}
      {editOpen && (
        <EditControlPlaneV2WizardDataLoader
          isOpen={editOpen}
          setIsOpen={setEditOpen}
          namespace={namespace}
          resourceName={resourceName}
          initialSection="supportInfo"
        />
      )}
    </>
  );
}
