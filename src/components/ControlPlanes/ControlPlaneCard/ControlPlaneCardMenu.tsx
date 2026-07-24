import { Button, Menu, MenuItem, MenuSeparator } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/download';
import { Dispatch, FC, SetStateAction, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiResource } from '../../../lib/api/useApiResource.ts';
import { GetKubeconfig } from '../../../lib/api/types/crate/getKubeconfig.ts';
import { DownloadKubeconfig } from '../CopyKubeconfigButton.tsx';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';

type ControlPlanesListMenuProps = {
  setDialogDeleteMcpIsOpen: Dispatch<SetStateAction<boolean>>;
  isDeleteMcpButtonDisabled: boolean;
  setIsEditManagedControlPlaneWizardOpen: (isOpen: boolean, mode?: 'edit' | 'duplicate') => void;
  controlPlaneName: string;
  namespace: string;
  secretName: string;
  secretKey: string;
};

export const ControlPlaneCardMenu: FC<ControlPlanesListMenuProps> = ({
  setDialogDeleteMcpIsOpen,
  isDeleteMcpButtonDisabled,
  setIsEditManagedControlPlaneWizardOpen,
  controlPlaneName,
  namespace,
  secretName,
  secretKey,
}) => {
  const openerId = useId();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const hasAccessInfo = !!(secretKey && secretName && namespace);
  // Only fetch the kubeconfig once the menu is opened — avoids one REST call
  // per card on mount for every control plane in the workspace grid.
  const { data: kubeconfigResource } = useApiResource(
    GetKubeconfig(secretKey, secretName, namespace),
    undefined,
    undefined,
    !hasAccessInfo || !menuIsOpen,
  );

  const handleOpenerClick = () => {
    setMenuIsOpen(true);
  };

  return (
    <>
      <Button
        id={openerId}
        design="Transparent"
        icon="overflow"
        icon-end
        data-testid="ControlPlaneCardMenu-opener"
        onClick={handleOpenerClick}
      />
      <Menu
        open={menuIsOpen}
        opener={openerId}
        onItemClick={(event) => {
          const action = (event.detail.item as HTMLElement).dataset.action;
          if (action === 'editMcp') {
            setIsEditManagedControlPlaneWizardOpen(true, 'edit');
          }
          if (action === 'duplicateMcp') {
            setIsEditManagedControlPlaneWizardOpen(true, 'duplicate');
          }
          if (action === 'deleteMcp') {
            setDialogDeleteMcpIsOpen(true);
          }
          if (action === 'downloadKubeconfig') {
            DownloadKubeconfig(kubeconfigResource, controlPlaneName);
            telemetry.track({ name: 'kubeconfig.downloaded', source: 'controlplane-card' });
          }

          setMenuIsOpen(false);
        }}
        onClose={() => {
          setMenuIsOpen(false);
        }}
      >
        <MenuItem
          data-action="deleteMcp"
          disabled={isDeleteMcpButtonDisabled}
          icon="delete"
          text={t('ControlPlaneCard.deleteMCP')}
        />
        <MenuItem data-action="duplicateMcp" icon="copy" text={t('ControlPlaneCard.duplicateMCP')} />
        <MenuItem
          data-action="editMcp"
          disabled={isDeleteMcpButtonDisabled}
          icon="edit"
          text={t('ControlPlaneCard.editMCP')}
        />
        <MenuSeparator />
        <MenuItem data-action="downloadKubeconfig" icon="download" text={t('ConnectButton.downloadKubeconfig')} />
      </Menu>
    </>
  );
};
