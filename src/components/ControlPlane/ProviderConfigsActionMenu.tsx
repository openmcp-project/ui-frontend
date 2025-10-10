import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProviderConfigItem } from '../../lib/shared/types';
import { ActionsMenu, type ActionItem } from './ActionsMenu';

interface ProviderConfigsRowActionsMenuProps {
  item: ProviderConfigItem;
  onEdit: (item: ProviderConfigItem) => void;
}

export const ProviderConfigsRowActionsMenu: FC<ProviderConfigsRowActionsMenuProps> = ({ item, onEdit }) => {
  const { t } = useTranslation();

  const actions: ActionItem<ProviderConfigItem>[] = [
    {
      key: 'edit',
      text: t('ManagedResources.editAction', 'Edit'),
      icon: 'edit',
      onClick: onEdit,
    },
  ];

  return <ActionsMenu item={item} actions={actions} />;
};
