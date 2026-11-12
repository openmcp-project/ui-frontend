import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/edit';
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
  projectNamespace: string;
  members: Member[];
  onEditClick: () => void;
  onDeleteClick: () => void;
  isForbidden?: boolean;
}

export function WorkspaceInfoPopover({
  opener,
  open,
  onClose,
  workspaceName,
  workspaceDisplayName,
  namespace,
  projectNamespace,
  members,
  onEditClick,
  onDeleteClick,
  isForbidden = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <Popover
      opener={opener}
      placement={PopoverPlacement.Bottom}
      open={open}
      preventInitialFocus
      header={
        <Bar
          design="Header"
          startContent={<Title level="H5">{workspaceDisplayName || workspaceName}</Title>}
          endContent={
            <div className={styles.headerActions}>
              <YamlViewButton
                variant="loader"
                workspaceName={projectNamespace}
                resourceName={workspaceName}
                resourceType="workspaces"
              />
            </div>
          }
        />
      }
      footer={
        !isForbidden ? (
          <Bar
            design="Footer"
            endContent={
              <div className={styles.footerActions}>
                <Button
                  design="Transparent"
                  icon="edit"
                  onClick={() => {
                    onClose();
                    onEditClick();
                  }}
                >
                  {t('WorkspaceInfoPopover.editButton')}
                </Button>
                <Button
                  design="Transparent"
                  icon="delete"
                  className={styles.deleteButton}
                  onClick={() => {
                    onClose();
                    onDeleteClick();
                  }}
                >
                  {t('WorkspaceInfoPopover.deleteButton')}
                </Button>
              </div>
            }
          />
        ) : undefined
      }
      onClose={onClose}
    >
      <div className={styles.content}>
        <div className={styles.grid}>
          <Label>{t('Entities.Workspace')}</Label>
          <Text>{workspaceName}</Text>
          <Label>{t('common.namespace')}</Label>
          <CopyButton className={styles.copyValue} text={namespace} source="workspace-namespace" />
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
