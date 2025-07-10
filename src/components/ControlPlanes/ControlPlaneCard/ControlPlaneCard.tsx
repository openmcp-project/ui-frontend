import { Button, Card, FlexBox, Label, Title } from '@ui5/webcomponents-react';
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
import {
  ListControlPlanesType,
  ReadyStatus,
} from '../../../lib/api/types/crate/controlPlanes.ts';
import { ListWorkspacesType } from '../../../lib/api/types/crate/listWorkspaces.ts';
import useResource, {
  useApiResourceMutation,
} from '../../../lib/api/useApiResource.ts';
import {
  DeleteMCPResource,
  DeleteMCPType,
  PatchMCPResourceForDeletion,
  PatchMCPResourceForDeletionBody,
} from '../../../lib/api/types/crate/deleteMCP.ts';

import { YamlViewButtonWithLoader } from '../../Yaml/YamlViewButtonWithLoader.tsx';
import { useToast } from '../../../context/ToastContext.tsx';
import { canConnectToMCP } from '../controlPlanes.ts';
import { ResourceObject } from '../../../lib/api/types/crate/resourceObject.ts';
import { Infobox } from '../../Ui/Infobox/Infobox.tsx';

interface Props {
  controlPlane: ListControlPlanesType;
  workspace: ListWorkspacesType;
  projectName: string;
}

export function ControlPlaneCard({
  controlPlane,
  workspace,
  projectName,
}: Props) {
  const [dialogDeleteMcpIsOpen, setDialogDeleteMcpIsOpen] = useState(false);
  const toast = useToast();
  const { t } = useTranslation();

  const { trigger: patchTrigger } = useApiResourceMutation<DeleteMCPType>(
    PatchMCPResourceForDeletion(
      controlPlane.metadata.namespace,
      controlPlane.metadata.name,
    ),
  );
  const { trigger: deleteTrigger } = useApiResourceMutation<DeleteMCPType>(
    DeleteMCPResource(
      controlPlane.metadata.namespace,
      controlPlane.metadata.name,
    ),
  );

  const name = controlPlane.metadata.name;
  const namespace = controlPlane.metadata.namespace;

  const isSystemIdentityProviderEnabled =
    !!controlPlane.spec?.authentication
      ?.enableSystemIdentityProvider;

  const isConnectButtonEnabled =
    canConnectToMCP(controlPlane) &&
    isSystemIdentityProviderEnabled

  const showWarningBecauseOfDisabledSystemIdentityProvider =
    !isSystemIdentityProviderEnabled;

  return (
    <>
      <Card key={`${name}--${namespace}`} className={styles.card}>
        <div className={styles.container}>
          <FlexBox direction="Column">
            <FlexBox direction="Row" justifyContent="SpaceBetween">
              <FlexBox direction="Column">
                <Title level={TitleLevel.H5}>{name}</Title>
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
            <FlexBox
              direction="Row"
              justifyContent="SpaceBetween"
              alignItems="Center"
              className={styles.row}
            >
              <Button
                design={'Transparent'}
                icon="delete"
                disabled={
                  controlPlane.status?.status === ReadyStatus.InDeletion
                }
                onClick={() => {
                  setDialogDeleteMcpIsOpen(true);
                }}
              />
              <FlexBox
                direction="Row"
                justifyContent="SpaceBetween"
                alignItems="Center"
                gap={10}
              >
                <YamlViewButtonWithLoader
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
    </>
  );
}
