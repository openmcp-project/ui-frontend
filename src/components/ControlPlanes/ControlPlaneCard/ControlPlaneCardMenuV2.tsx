import { Button, Menu, MenuItem, MenuSeparator } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/download';
import '@ui5/webcomponents-icons/dist/edit';
import { Dispatch, FC, SetStateAction, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKubeconfigQuery } from '../../../spaces/onboarding/hooks/useKubeconfigQuery.ts';
import { DownloadKubeconfig } from '../CopyKubeconfigButton.tsx';

type ControlPlaneCardMenuV2Props = {
  setDialogDeleteMcpIsOpen: Dispatch<SetStateAction<boolean>>;
  isDeleteMcpButtonDisabled: boolean;
  setIsEditManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
  controlPlaneName: string;
  mcpNamespace: string;
  oidcOpenmcpSecretName: string | undefined;
};

export const ControlPlaneCardMenuV2: FC<ControlPlaneCardMenuV2Props> = ({
  setDialogDeleteMcpIsOpen,
  isDeleteMcpButtonDisabled,
  setIsEditManagedControlPlaneWizardOpen,
  controlPlaneName,
  mcpNamespace,
  oidcOpenmcpSecretName,
}) => {
  const openerId = useId();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();
  const { kubeconfigDecoded } = useKubeconfigQuery(oidcOpenmcpSecretName, mcpNamespace, 'kubeconfig');

  return (
    <>
      <Button
        id={openerId}
        design="Transparent"
        icon="overflow"
        icon-end
        data-testid="ControlPlaneCardMenuV2-opener"
        onClick={() => setMenuIsOpen(true)}
      />
      <Menu
        open={menuIsOpen}
        opener={openerId}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'editMcp') {
            setIsEditManagedControlPlaneWizardOpen(true);
          }
          if (action === 'deleteMcp') {
            setDialogDeleteMcpIsOpen(true);
          }
          if (action === 'downloadKubeconfig') {
            DownloadKubeconfig(kubeconfigDecoded, controlPlaneName);
          }
          setMenuIsOpen(false);
        }}
        onClose={() => setMenuIsOpen(false)}
      >
        <MenuItem text={t('ControlPlaneCard.editMCP')} data-action="editMcp" icon="edit" />
        <MenuItem
          text={t('ControlPlaneCard.deleteMCP')}
          data-action="deleteMcp"
          icon="delete"
          disabled={isDeleteMcpButtonDisabled}
        />
        <MenuSeparator />
        <MenuItem data-action="downloadKubeconfig" icon="download" text={t('ConnectButton.downloadKubeconfig')} />
      </Menu>
    </>
  );
};
