import {
  Button,
  Grid,
  ObjectPageSection,
  Panel,
  Title,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { CopyButton } from '../../Shared/CopyButton.tsx';
import { NoManagedControlPlaneBanner } from '../NoManagedControlPlaneBanner.tsx';
import { ControlPlaneCard } from '../ControlPlaneCard/ControlPlaneCard.tsx';
import {
  ListWorkspacesType,
  isWorkspaceReady,
} from '../../../lib/api/types/crate/listWorkspaces.ts';
import { useState } from 'react';
import { MembersAvatarView } from './MembersAvatarView.tsx';
import {
  DeleteWorkspaceResource,
  DeleteWorkspaceType,
} from '../../../lib/api/types/crate/deleteWorkspace.ts';
import {
  useApiResourceMutation,
  useApiResource,
} from '../../../lib/api/useApiResource.ts';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import { KubectlDeleteWorkspace } from '../../Dialogs/KubectlCommandInfo/Controllers/KubectlDeleteWorkspace.tsx';
import { useToast } from '../../../context/ToastContext.tsx';
import { ListControlPlanes } from '../../../lib/api/types/crate/controlPlanes.ts';
import IllustratedError from '../../Shared/IllustratedError.tsx';
import { APIError } from '../../../lib/api/error.ts';
import { useTranslation } from 'react-i18next';
import { YamlViewButton } from '@components/Yaml/YamlViewButton.tsx';

interface Props {
  projectName: string;
  workspace: ListWorkspacesType;
}

export function ControlPlaneListWorkspaceGridTile({
  projectName,
  workspace,
}: Props) {
  const workspaceName = workspace.metadata.name;
  const workspaceDisplayName =
    workspace.metadata.annotations?.[DISPLAY_NAME_ANNOTATION] || '';
  const showDisplayName = workspaceDisplayName.length > 0;
  const projectNamespace = workspace.metadata.namespace;

  const { t } = useTranslation();

  const toast = useToast();
  const [dialogDeleteWsIsOpen, setDialogDeleteWsIsOpen] = useState(false);

  const { data: controlplanes, error: cpsError } = useApiResource(
    ListControlPlanes(projectName, workspaceName),
  );
  const { trigger } = useApiResourceMutation<DeleteWorkspaceType>(
    DeleteWorkspaceResource(projectNamespace, workspaceName),
  );
  const errorView = createErrorView(cpsError);

  function createErrorView(error: APIError) {
    if (error) {
      if (error.status === 403) {
        return (
          <IllustratedError
            title={t(
              'ControlPlaneListWorkspaceGridTile.permissionErrorMessage',
            )}
            subtitleText={t(
              'ControlPlaneListWorkspaceGridTile.permissionErrorMessageSubtitle',
            )}
          />
        );
      } else {
        return (
          <IllustratedError
            title={t('ControlPlaneListWorkspaceGridTile.loadingErrorMessage')}
          />
        );
      }
    }
    return null;
  }

  return (
    <>
      <ObjectPageSection
        key={`${projectName}${workspaceName}`}
        id={workspaceName}
        titleText={workspaceName}
        hideTitleText
      >
        <Panel
          headerLevel="H2"
          style={{ margin: '12px 12px 12px 0' }}
          collapsed={controlplanes?.length === 0}
          header={
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '0.3fr 0.3fr 0.24fr auto',
                gap: '1rem',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Title level="H3">
                {showDisplayName ? workspaceDisplayName : workspaceName}{' '}
                {!isWorkspaceReady(workspace) ? '(Loading)' : ''}
              </Title>

              <CopyButton
                text={workspace.status?.namespace || '-'}
                style={{ justifyContent: 'start' }}
              />

              <MembersAvatarView
                members={workspace.spec.members}
                project={projectName}
                workspace={workspaceName}
              />
              <span>
                <YamlViewButton
                  workspaceName={workspace.metadata.namespace}
                  resourceName={workspaceName}
                  resourceType={'workspaces'}
                />
                <Button
                  design={ButtonDesign.Transparent}
                  icon="delete"
                  onClick={async () => {
                    setDialogDeleteWsIsOpen(true);
                  }}
                />
              </span>
            </div>
          }
          noAnimation
        >
          {errorView ? (
            errorView
          ) : (
            <Grid defaultSpan="XL4 L4 M7 S12">
              {controlplanes?.length === 0 ? (
                <NoManagedControlPlaneBanner />
              ) : (
                controlplanes?.map((cp) => (
                  <ControlPlaneCard
                    key={`${cp.metadata.name}--${cp.metadata.namespace}`}
                    controlPlane={cp}
                    projectName={projectName}
                    workspace={workspace}
                  />
                ))
              )}
            </Grid>
          )}
        </Panel>
      </ObjectPageSection>
      <DeleteConfirmationDialog
        resourceName={workspaceName}
        kubectl={
          <KubectlDeleteWorkspace
            projectName={projectName}
            resourceName={workspaceName}
          />
        }
        isOpen={dialogDeleteWsIsOpen}
        setIsOpen={setDialogDeleteWsIsOpen}
        onDeletionConfirmed={async () => {
          await trigger();
          toast.show(
            t('ControlPlaneListWorkspaceGridTile.deleteConfirmationDialog'),
          );
        }}
      />
    </>
  );
}
