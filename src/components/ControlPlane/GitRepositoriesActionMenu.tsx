import { FC, useRef, useState } from 'react';
import { Button, Menu, MenuItem, MenuDomRef } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import type { Ui5CustomEvent, ButtonDomRef } from '@ui5/webcomponents-react';
import type { GitReposResponse } from '../../lib/api/types/flux/listGitRepo';

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
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);

  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (popoverRef.current && e.currentTarget) {
      popoverRef.current.opener = e.currentTarget as unknown as HTMLElement;
      setOpen((prev) => !prev);
    }
  };

  return (
    <>
      <Button icon="overflow" design="Transparent" onClick={handleOpenerClick} />
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          const element = event.detail.item as HTMLElement;
          const action = element.dataset.action;
          if (action === 'edit') {
            onEdit(item);
          }
          setOpen(false);
        }}
      >
        <MenuItem text={t('ManagedResources.editAction', 'Edit')} icon="edit" data-action="edit" />
      </Menu>
    </>
  );
};
