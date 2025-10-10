import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { KustomizationsResponse } from '../../lib/api/types/flux/listKustomization';
import { ActionsMenu, type ActionItem } from './ActionsMenu';

export type KustomizationItem = KustomizationsResponse['items'][0] & {
  apiVersion?: string;
  metadata: KustomizationsResponse['items'][0]['metadata'] & { namespace?: string };
};

interface KustomizationsRowActionsMenuProps {
  item: KustomizationItem;
  onEdit: (item: KustomizationItem) => void;
}

export const KustomizationsRowActionsMenu: FC<KustomizationsRowActionsMenuProps> = ({ item, onEdit }) => {
  const { t } = useTranslation();

  const actions: ActionItem<KustomizationItem>[] = [
    {
      key: 'edit',
      text: t('ManagedResources.editAction', 'Edit'),
      icon: 'edit',
      onClick: onEdit,
    },
  ];

  return <ActionsMenu item={item} actions={actions} />;
};
