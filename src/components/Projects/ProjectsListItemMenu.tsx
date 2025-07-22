import { Button, ButtonDomRef, Menu, MenuItem, Ui5CustomEvent, MenuDomRef } from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import { FC, useRef, useState } from 'react';
import '@ui5/webcomponents-icons/dist/copy';
import '@ui5/webcomponents-icons/dist/accept';

import { useTranslation } from 'react-i18next';
import { DeleteConfirmationDialog } from '../Dialogs/DeleteConfirmationDialog.tsx';

import { useToast } from '../../context/ToastContext.tsx';
import { useApiResourceMutation } from '../../lib/api/useApiResource.ts';
import { DeleteWorkspaceType } from '../../lib/api/types/crate/deleteWorkspace.ts';
import { DeleteProjectResource } from '../../lib/api/types/crate/deleteProject.ts';
import { KubectlDeleteProject } from '../Dialogs/KubectlCommandInfo/Controllers/KubectlDeleteProject.tsx';

type ProjectsListItemMenuProps = {
  projectName: string;
};

export const ProjectsListItemMenu: FC<ProjectsListItemMenuProps> = ({ projectName }) => {
  const popoverRef = useRef<MenuDomRef>(null);
  const [open, setOpen] = useState(false);
  const [dialogDeleteProjectIsOpen, setDialogDeleteProjectIsOpen] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();
  const { trigger } = useApiResourceMutation<DeleteWorkspaceType>(DeleteProjectResource(projectName));
  const handleOpenerClick = (e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (popoverRef.current && e.currentTarget) {
      popoverRef.current.opener = e.currentTarget as HTMLElement;
      setOpen((prev) => !prev);
    }
  };

  return (
    <div>
      <Button icon="overflow" icon-end onClick={handleOpenerClick} />
      <Menu
        ref={popoverRef}
        open={open}
        onItemClick={(event) => {
          event.stopImmediatePropagation();
          event.stopPropagation();
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'deleteProject') {
            setDialogDeleteProjectIsOpen(true);
          }

          setOpen(false);
        }}
      >
        <MenuItem key={'delete'} text={t('ProjectsListView.deleteProject')} data-action="deleteProject" icon="delete" />
      </Menu>

      {dialogDeleteProjectIsOpen && (
        <DeleteConfirmationDialog
          resourceName={projectName}
          kubectl={<KubectlDeleteProject projectName={projectName} />}
          isOpen={dialogDeleteProjectIsOpen}
          setIsOpen={setDialogDeleteProjectIsOpen}
          onDeletionConfirmed={async () => {
            await trigger();
            toast.show(t('ProjectsListView.deleteConfirmationDialog'));
          }}
        />
      )}
    </div>
  );
};
