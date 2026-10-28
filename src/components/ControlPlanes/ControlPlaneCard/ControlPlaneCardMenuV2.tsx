import { Button, Menu, MenuItem, MenuSeparator } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/download';
import '@ui5/webcomponents-icons/dist/edit';
import { Dispatch, FC, SetStateAction, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControlPlaneStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { buildDownloadKubeconfigOptionsV2 } from './buildDownloadKubeconfigOptionsV2.ts';
import { useDownloadKubeconfig as _useDownloadKubeconfig } from './useDownloadKubeconfig.ts';
import { useTelemetry as _useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { useToast as _useToast } from '../../../context/ToastContext.tsx';

type ControlPlaneCardMenuV2Props = {
  setDialogDeleteMcpIsOpen: Dispatch<SetStateAction<boolean>>;
  isDeleteMcpButtonDisabled: boolean;
  setIsEditManagedControlPlaneWizardOpen: Dispatch<SetStateAction<boolean>>;
  controlPlaneName: string;
  mcpNamespace: string;
  access: ControlPlaneStatus['access'] | undefined;
  useDownloadKubeconfig?: typeof _useDownloadKubeconfig;
  useTelemetry?: typeof _useTelemetry;
  useToast?: typeof _useToast;
};

export const ControlPlaneCardMenuV2: FC<ControlPlaneCardMenuV2Props> = ({
  setDialogDeleteMcpIsOpen,
  isDeleteMcpButtonDisabled,
  setIsEditManagedControlPlaneWizardOpen,
  controlPlaneName,
  mcpNamespace,
  access,
  useDownloadKubeconfig = _useDownloadKubeconfig,
  useTelemetry = _useTelemetry,
  useToast = _useToast,
}) => {
  const openerId = useId();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const toast = useToast();
  const downloadKubeconfig = useDownloadKubeconfig(mcpNamespace);

  const options = useMemo(() => buildDownloadKubeconfigOptionsV2(access), [access]);
  const isMultiIdP = options.length > 1;
  const singleOption = options.length === 1 ? options[0] : undefined;
  const systemOptions = options.filter((option) => option.isSystemIdP);
  const customOptions = options.filter((option) => !option.isSystemIdP);

  const download = async (idpKey: string) => {
    const option = options.find((candidate) => candidate.idpKey === idpKey);
    if (!option) return;

    setMenuIsOpen(false);
    const downloaded = await downloadKubeconfig(option.secretName, `${controlPlaneName}-${option.user}`);
    if (downloaded) {
      telemetry.track({ category: 'kubeconfig', action: 'downloaded', source: 'controlplane-card' });
    } else {
      toast.show(t('ConnectButton.downloadKubeconfigError'));
    }
  };

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
          const { action, idpKey } = (event.detail.item as HTMLElement).dataset;
          if (action === 'editMcp') {
            setIsEditManagedControlPlaneWizardOpen(true);
            setMenuIsOpen(false);
            return;
          }
          if (action === 'deleteMcp') {
            setDialogDeleteMcpIsOpen(true);
            setMenuIsOpen(false);
            return;
          }
          if (action === 'downloadKubeconfig' && idpKey) {
            void download(idpKey);
          }
        }}
        onClose={() => setMenuIsOpen(false)}
      >
        <MenuItem
          text={t('ControlPlaneCard.editMCP')}
          data-action="editMcp"
          icon="edit"
          disabled={isDeleteMcpButtonDisabled}
        />
        <MenuItem
          text={t('ControlPlaneCard.deleteMCP')}
          data-action="deleteMcp"
          icon="delete"
          disabled={isDeleteMcpButtonDisabled}
        />
        <MenuSeparator />
        {singleOption ? (
          <MenuItem
            data-action="downloadKubeconfig"
            data-idp-key={singleOption.idpKey}
            icon="download"
            text={t('ConnectButton.downloadKubeconfig')}
          />
        ) : (
          <MenuItem
            data-testid="download-kubeconfig-parent"
            disabled={!isMultiIdP}
            icon="download"
            text={t('ConnectButton.downloadKubeconfig')}
          >
            {systemOptions.map((option) => (
              <MenuItem
                key={option.idpKey}
                additionalText={t('ConnectButton.defaultIdP')}
                data-action="downloadKubeconfig"
                data-idp-key={option.idpKey}
                text={option.user}
              />
            ))}
            {systemOptions.length > 0 && customOptions.length > 0 && <MenuSeparator />}
            {customOptions.map((option) => (
              <MenuItem
                key={option.idpKey}
                additionalText={t('ConnectButton.customIdP')}
                data-action="downloadKubeconfig"
                data-idp-key={option.idpKey}
                text={option.user}
              />
            ))}
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
