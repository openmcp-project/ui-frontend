import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/edit';
import { Bar, BusyIndicator, Button, Label, Popover, Text, Title } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useTranslation } from 'react-i18next';
import { useProjectMembers as _useProjectMembers } from '../../../spaces/onboarding/hooks/useProjectMembers.ts';
import { projectnameToNamespace } from '../../../utils/index.ts';
import { CopyButton } from '../../Shared/CopyButton.tsx';
import { YamlViewButton } from '../../Yaml/YamlViewButton.tsx';
import { MembersAvatarView } from './MembersAvatarView.tsx';
import styles from './ProjectInfoPopover.module.css';

interface Props {
  opener: string;
  open: boolean;
  projectName: string;
  useProjectMembers?: typeof _useProjectMembers;
  onClose: () => void;
  onDeleteClick: () => void;
  onEditClick: () => void;
}

export function ProjectInfoPopover({
  opener,
  open,
  projectName,
  useProjectMembers = _useProjectMembers,
  onClose,
  onDeleteClick,
  onEditClick,
}: Props) {
  const { t } = useTranslation();
  const { displayName, members, isLoading } = useProjectMembers(projectName);

  return (
    <Popover
      opener={opener}
      placement={PopoverPlacement.Bottom}
      open={open}
      header={
        <Bar
          design="Header"
          startContent={<Title level="H5">{displayName || projectName}</Title>}
          endContent={
            <div className={styles.headerActions}>
              <YamlViewButton variant="loader" resourceType="projects" resourceName={projectName} />
              <Button
                design="Transparent"
                icon="edit"
                onClick={() => {
                  onClose();
                  onEditClick();
                }}
              >
                {t('ProjectInfoPopover.editButton')}
              </Button>
              <Button
                design="Transparent"
                icon="delete"
                onClick={() => {
                  onClose();
                  onDeleteClick();
                }}
              >
                {t('ProjectInfoPopover.deleteButton')}
              </Button>
            </div>
          }
        />
      }
      onClose={onClose}
    >
      {isLoading ? (
        <BusyIndicator active className={styles.loader} />
      ) : (
        <div className={styles.content}>
          <div className={styles.grid}>
            <Label>{t('Entities.Project')}</Label>
            <Text>{projectName}</Text>
            <Label>{t('common.namespace')}</Label>
            <CopyButton text={projectnameToNamespace(projectName)} source="project-namespace" />
          </div>
          {members.length > 0 && (
            <div className={styles.section}>
              <Label>
                {t('common.members')} ({members.length})
              </Label>
              <MembersAvatarView members={members} source="project-popover" />
            </div>
          )}
        </div>
      )}
    </Popover>
  );
}
