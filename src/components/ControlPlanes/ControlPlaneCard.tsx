import { Button, Card, FlexBox, Label, Title } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import ConnectButton from './ConnectButton.tsx';
import { ListWorkspacesType } from '../../lib/api/types/crate/listWorkspaces.ts';
import {
  ListControlPlanesType,
  ReadyStatus,
} from '../../lib/api/types/crate/controlPlanes.ts';
import TitleLevel from '@ui5/webcomponents/dist/types/TitleLevel.js';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useState } from 'react';
import { useApiResourceMutation } from '../../lib/api/useApiResource.ts';
import {
  DeleteMCPResource,
  DeleteMCPType,
  PatchMCPResourceForDeletion,
  PatchMCPResourceForDeletionBody,
} from '../../lib/api/types/crate/deleteMCP.ts';
import { DeleteConfirmationDialog } from '../Dialogs/DeleteConfirmationDialog.tsx';
import MCPHealthPopoverButton from '../ControlPlane/MCPHealthPopoverButton.tsx';

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

  return (
    <>
      <Card
        key={`${name}--${namespace}`}
        style={{ margin: '12px 12px 12px 0' }}
      >
        <div style={{ padding: '20px' }}>
          <FlexBox direction="Column">
            <FlexBox direction="Row" justifyContent="SpaceBetween">
              <FlexBox direction="Column">
                <Title level={TitleLevel.H5}>{name}</Title>
                <Label>{workspace.metadata.name} </Label>
              </FlexBox>
              <div>
                <Button
                  design={ButtonDesign.Transparent}
                  icon="delete"
                  disabled={
                    controlPlane.status?.status === ReadyStatus.InDeletion
                  }
                  onClick={() => {
                    setDialogDeleteMcpIsOpen(true);
                  }}
                />
              </div>
            </FlexBox>
            <FlexBox
              direction="Row"
              justifyContent="SpaceBetween"
              alignItems="Center"
              style={{ paddingTop: '20px' }}
            >
              <MCPHealthPopoverButton mcpStatus={controlPlane.status} />
              <ConnectButton
                disabled={controlPlane.status?.status !== ReadyStatus.Ready}
                controlPlaneName={name}
                projectName={projectName}
                workspaceName={workspace.metadata.name ?? ''}
                namespace={controlPlane.status?.access?.namespace ?? ''}
                secretName={controlPlane.status?.access?.name ?? ''}
                secretKey={controlPlane.status?.access?.key ?? ''}
              />
            </FlexBox>
          </FlexBox>
        </div>
      </Card>
      <DeleteConfirmationDialog
        resourceName={controlPlane.metadata.name}
        isOpen={dialogDeleteMcpIsOpen}
        setIsOpen={setDialogDeleteMcpIsOpen}
        onDeletionConfirmed={async () => {
          await patchTrigger(PatchMCPResourceForDeletionBody);
          await deleteTrigger();
        }}
      />
    </>
  );
}
