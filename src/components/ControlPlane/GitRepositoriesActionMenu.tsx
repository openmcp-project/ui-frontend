import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { GitReposResponse } from '../../lib/api/types/flux/listGitRepo';
import { ActionsMenu, type ActionItem } from './ActionsMenu';

export type GitRepoItem = GitReposResponse['items'][0] & {
  apiVersion?: string;
  metadata: GitReposResponse['items'][0]['metadata'] & { namespace?: string };
};

interface GitRepositoriesRowActionsMenuProps {
  item: GitRepoItem;
  onEdit: (item: GitRepoItem) => void;
}

export const GitRepositoriesRowActionsMenu: FC<GitRepositoriesRowActionsMenuProps> = ({ item, onEdit }) => {
  const { t } = useTranslation();

  const actions: ActionItem<GitRepoItem>[] = [
    {
      key: 'edit',
      text: t('ManagedResources.editAction', 'Edit'),
      icon: 'edit',
      onClick: onEdit,
    },
  ];

  return <ActionsMenu item={item} actions={actions} />;
};
