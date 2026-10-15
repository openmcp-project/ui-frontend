import { Tag } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { purposeColorScheme, purposeLabel, SupportInfo } from '../../../lib/supportInfo.ts';
import { EditWorkspaceDialogContainer } from '../../Dialogs/EditWorkspaceDialogContainer.tsx';
import { ProjectSupportInfoPopover } from '../../Projects/ProjectSupportInfoPopover.tsx';
import { HoverRevealTag } from '../../Ui/HoverRevealTag/HoverRevealTag.tsx';
import styles from './WorkspacesList.module.css';

interface Props {
  workspaceName: string;
  namespace: string;
  supportInfo: SupportInfo;
}

export function WorkspaceSupportInfoTag({ workspaceName, namespace, supportInfo }: Props) {
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
          className={styles.metadataTag}
          colorScheme={purposeColorScheme(undefined)}
          copy={t('SupportInfo.addButton')}
          design="Set2"
          id={openerId}
          onClick={() => setEditOpen(true)}
        />
        {editOpen && (
          <EditWorkspaceDialogContainer
            isOpen={editOpen}
            setIsOpen={setEditOpen}
            workspaceName={workspaceName}
            namespace={namespace}
            initialStep="supportInfo"
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
        className={styles.metadataTag}
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
        <EditWorkspaceDialogContainer
          isOpen={editOpen}
          setIsOpen={setEditOpen}
          workspaceName={workspaceName}
          namespace={namespace}
          initialStep="supportInfo"
        />
      )}
    </>
  );
}
