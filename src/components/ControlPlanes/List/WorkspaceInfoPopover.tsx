import { Bar, Button, Label, Popover, Text, Title } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { Member } from '../../../lib/api/types/shared/members.ts';
import { CopyButton } from '../../Shared/CopyButton.tsx';
import { YamlViewButton } from '../../Yaml/YamlViewButton.tsx';
import { MembersAvatarView } from './MembersAvatarView.tsx';
import styles from './WorkspaceInfoPopover.module.css';

interface Props {
  opener: string;
  open: boolean;
  onClose: () => void;
  workspaceName: string;
  workspaceDisplayName?: string;
  namespace: string;
  members: Member[];
  onEditClick: () => void;
}

export function WorkspaceInfoPopover({
  opener,
  open,
  onClose,
  workspaceName,
  workspaceDisplayName,
  namespace,
  members,
  onEditClick,
}: Props) {
  const { t } = useTranslation();

  return (
    <Popover
      opener={opener}
      placement={PopoverPlacement.Bottom}
      open={open}
      header={
        <Bar
          design="Header"
          startContent={<Title level="H5">{workspaceDisplayName || workspaceName}</Title>}
          endContent={
            <div className={styles.headerActions}>
              <YamlViewButton
                variant="loader"
                workspaceName={namespace}
                resourceName={workspaceName}
                resourceType="workspaces"
              />
              <Button design="Transparent" icon="edit" onClick={onEditClick}>
                {t('WorkspaceInfoPopover.editButton')}
              </Button>
            </div>
          }
        />
      }
      onClose={onClose}
    >
      <div className={styles.content}>
        <div className={styles.grid}>
          <Label>{t('Entities.Workspace')}</Label>
          <Text>{workspaceName}</Text>
          <Label>{t('common.namespace')}</Label>
          <CopyButton text={namespace || '-'} source="workspace-namespace" />
        </div>

        {members.length > 0 && (
          <div className={styles.section}>
            <Label>
              {t('common.members')} ({members.length})
            </Label>
            <MembersAvatarView members={members} source="workspace-grid" />
          </div>
        )}
      </div>
    </Popover>
  );
}
