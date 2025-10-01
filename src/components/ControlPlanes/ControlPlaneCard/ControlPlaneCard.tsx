import { Card, FlexBox, Label, Title } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import ConnectButton from '../ConnectButton.tsx';

import TitleLevel from '@ui5/webcomponents/dist/types/TitleLevel.js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import MCPHealthPopoverButton from '../../ControlPlane/MCPHealthPopoverButton.tsx';
import styles from './ControlPlaneCard.module.css';
import { KubectlDeleteMcp } from '../../Dialogs/KubectlCommandInfo/Controllers/KubectlDeleteMcp.tsx';
import { ListControlPlanesType, ReadyStatus } from '../../../lib/api/types/crate/controlPlanes.ts';
import { ListWorkspacesType } from '../../../lib/api/types/crate/listWorkspaces.ts';
import { useApiResourceMutation } from '../../../lib/api/useApiResource.ts';
import {
  DeleteMCPResource,
  DeleteMCPType,
  PatchMCPResourceForDeletion,
  PatchMCPResourceForDeletionBody,
} from '../../../lib/api/types/crate/deleteMCP.ts';

import { YamlViewButton } from '../../Yaml/YamlViewButton.tsx';
import { useToast } from '../../../context/ToastContext.tsx';
import { canConnectToMCP } from '../controlPlanes.ts';

import { Infobox } from '../../Ui/Infobox/Infobox.tsx';

import { ControlPlaneCardMenu } from './ControlPlaneCardMenu.tsx';
import { EditManagedControlPlaneWizardDataLoader } from '../../Wizards/CreateManagedControlPlane/EditManagedControlPlaneWizardDataLoader.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';

interface Props {
  controlPlane: ListControlPlanesType;
  workspace: ListWorkspacesType;
  projectName: string;
}

type MCPWizardState = {
  isOpen: boolean;
  mode?: 'edit' | 'duplicate';
};
export const ControlPlaneCard = ({ controlPlane, workspace, projectName }: Props) => {
  const [dialogDeleteMcpIsOpen, setDialogDeleteMcpIsOpen] = useState(false);
  const toast = useToast();
  const { t } = useTranslation();
  const [managedControlPlaneWizardState, setManagedControlPlaneWizardState] = useState<MCPWizardState>({
    isOpen: false,
    mode: undefined,
  });

  const handleIsManagedControlPlaneWizardOpen = (isOpen: boolean, mode?: 'edit' | 'duplicate') => {
    setManagedControlPlaneWizardState({ isOpen, mode });
  };
  const { trigger: patchTrigger } = useApiResourceMutation<DeleteMCPType>(
    PatchMCPResourceForDeletion(controlPlane.metadata.namespace, controlPlane.metadata.name),
  );
  const { trigger: deleteTrigger } = useApiResourceMutation<DeleteMCPType>(
    DeleteMCPResource(controlPlane.metadata.namespace, controlPlane.metadata.name),
  );

  const name = controlPlane.metadata.name;
  const displayName =
    controlPlane?.metadata?.annotations?.[DISPLAY_NAME_ANNOTATION as keyof typeof controlPlane.metadata.annotations];

  const namespace = controlPlane.metadata.namespace;

  const isSystemIdentityProviderEnabled = Boolean(controlPlane.spec?.authentication?.enableSystemIdentityProvider);

  const isConnectButtonEnabled = canConnectToMCP(controlPlane) && isSystemIdentityProviderEnabled;

  const showWarningBecauseOfDisabledSystemIdentityProvider = !isSystemIdentityProviderEnabled;

  return (
    <>
      <Card key={`${name}--${namespace}`} className={styles.card}>
        <div className={styles.container}>
          <FlexBox direction="Column">
            <FlexBox direction="Row" justifyContent="SpaceBetween">
              <FlexBox direction="Column">
                <Title level={TitleLevel.H5}>{displayName ? displayName : name}</Title>
                <Label>{workspace.metadata.name} </Label>
              </FlexBox>
              <div>
                <MCPHealthPopoverButton
                  mcpStatus={controlPlane.status}
                  projectName={projectName}
                  workspaceName={workspace.metadata.name ?? ''}
                  mcpName={controlPlane.metadata.name}
                />
              </div>
            </FlexBox>
            <FlexBox direction="Row" justifyContent="SpaceBetween" alignItems="Center" className={styles.row}>
              <ControlPlaneCardMenu
                setDialogDeleteMcpIsOpen={setDialogDeleteMcpIsOpen}
                isDeleteMcpButtonDisabled={controlPlane.status?.status === ReadyStatus.InDeletion}
                setIsEditManagedControlPlaneWizardOpen={handleIsManagedControlPlaneWizardOpen}
              />
              <FlexBox direction="Row" justifyContent="SpaceBetween" alignItems="Center" gap={10}>
                <YamlViewButton
                  variant="loader"
                  workspaceName={controlPlane.metadata.namespace}
                  resourceName={controlPlane.metadata.name}
                  resourceType={'managedcontrolplanes'}
                />
                {showWarningBecauseOfDisabledSystemIdentityProvider && (
                  <Infobox size="sm" variant="warning">
                    {t('ConnectButton.unsupportedIdP')}
                  </Infobox>
                )}
                <ConnectButton
                  disabled={!isConnectButtonEnabled}
                  controlPlaneName={name}
                  projectName={projectName}
                  workspaceName={workspace.metadata.name ?? ''}
                  namespace={controlPlane.status?.access?.namespace ?? ''}
                  secretName={controlPlane.status?.access?.name ?? ''}
                  secretKey={controlPlane.status?.access?.key ?? ''}
                />
              </FlexBox>
            </FlexBox>
          </FlexBox>
        </div>
      </Card>
      <DeleteConfirmationDialog
        resourceName={controlPlane.metadata.name}
        kubectl={
          <KubectlDeleteMcp
            projectName={projectName}
            workspaceName={workspace.metadata.name}
            resourceName={controlPlane.metadata.name}
          />
        }
        isOpen={dialogDeleteMcpIsOpen}
        setIsOpen={setDialogDeleteMcpIsOpen}
        onDeletionConfirmed={async () => {
          await patchTrigger(PatchMCPResourceForDeletionBody);
          await deleteTrigger();
          toast.show(t('ControlPlaneCard.deleteConfirmationDialog'));
        }}
      />
      <EditManagedControlPlaneWizardDataLoader
        isOpen={managedControlPlaneWizardState.isOpen}
        setIsOpen={(isOpen) => handleIsManagedControlPlaneWizardOpen(isOpen)}
        workspaceName={namespace}
        resourceName={name}
        mode={managedControlPlaneWizardState.mode}
      />
    </>
  );
};
