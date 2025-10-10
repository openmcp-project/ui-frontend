import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ManagedResourceItem } from '../../lib/shared/types';
import { ActionsMenu, type ActionItem } from './ActionsMenu';

interface RowActionsMenuProps {
  item: ManagedResourceItem;
  onOpen: (item: ManagedResourceItem) => void;
  onEdit: (item: ManagedResourceItem) => void;
}

export const RowActionsMenu: FC<RowActionsMenuProps> = ({ item, onOpen, onEdit }) => {
  const { t } = useTranslation();

  // Determine if the resource is managed by Flux based on the presence of the Flux label
  const fluxLabelValue = (item?.metadata?.labels as unknown as Record<string, unknown> | undefined)?.[
    'kustomize.toolkit.fluxcd.io/name'
  ];
  const isFluxManaged = typeof fluxLabelValue === 'string' ? fluxLabelValue.trim() !== '' : fluxLabelValue != null;

  const actions: ActionItem<ManagedResourceItem>[] = [
    {
      key: 'edit',
      text: t('ManagedResources.editAction', 'Edit'),
      icon: 'edit',
      disabled: isFluxManaged,
      onClick: onEdit,
    },
    {
      key: 'delete',
      text: t('ManagedResources.deleteAction'),
      icon: 'delete',
      onClick: onOpen,
    },
  ];

  return <ActionsMenu item={item} actions={actions} />;
};
