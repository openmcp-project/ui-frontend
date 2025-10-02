import { Button, FlexBox, ObjectPageSection, Panel, Title } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import { CopyButton } from '../../Shared/CopyButton.tsx';
import { ControlPlaneCard } from '../ControlPlaneCard/ControlPlaneCard.tsx';
import { ListWorkspacesType, isWorkspaceReady } from '../../../lib/api/types/crate/listWorkspaces.ts';
import { useMemo, useState } from 'react';
import { MembersAvatarView } from './MembersAvatarView.tsx';
import { DeleteWorkspaceResource, DeleteWorkspaceType } from '../../../lib/api/types/crate/deleteWorkspace.ts';
import { useApiResourceMutation, useApiResource } from '../../../lib/api/useApiResource.ts';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import { KubectlDeleteWorkspace } from '../../Dialogs/KubectlCommandInfo/Controllers/KubectlDeleteWorkspace.tsx';
import { useToast } from '../../../context/ToastContext.tsx';
import { ListControlPlanes } from '../../../lib/api/types/crate/controlPlanes.ts';
import IllustratedError from '../../Shared/IllustratedError.tsx';
import { APIError } from '../../../lib/api/error.ts';
import { useTranslation } from 'react-i18next';
import { YamlViewButton } from '../../Yaml/YamlViewButton.tsx';
import { IllustratedBanner } from '../../Ui/IllustratedBanner/IllustratedBanner.tsx';
import { useLink } from '../../../lib/shared/useLink.ts';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import styles from './WorkspacesList.module.css';
import { ControlPlanesListMenu } from '../ControlPlanesListMenu.tsx';
import { CreateManagedControlPlaneWizardContainer } from '../../Wizards/CreateManagedControlPlane/CreateManagedControlPlaneWizardContainer.tsx';

interface Props {
  projectName: string;
  workspace: ListWorkspacesType;
}

export function ControlPlaneListWorkspaceGridTile({ projectName, workspace }: Props) {
  const [isCreateManagedControlPlaneWizardOpen, setIsCreateManagedControlPlaneWizardOpen] = useState(false);
  const [initialTemplateName, setInitialTemplateName] = useState<string | undefined>(undefined);
  const workspaceName = workspace.metadata.name;
  const workspaceDisplayName = workspace.metadata.annotations?.[DISPLAY_NAME_ANNOTATION] || '';
  const showDisplayName = workspaceDisplayName.length > 0;
  const projectNamespace = workspace.metadata.namespace;

  const { t } = useTranslation();

  const toast = useToast();
  const [dialogDeleteWsIsOpen, setDialogDeleteWsIsOpen] = useState(false);

  const { data: controlplanes, error: cpsError } = useApiResource(ListControlPlanes(projectName, workspaceName));
  const { trigger } = useApiResourceMutation<DeleteWorkspaceType>(
    DeleteWorkspaceResource(projectNamespace, workspaceName),
  );

  const { mcpCreationGuide } = useLink();
  const errorView = createErrorView(cpsError);
  const shouldCollapsePanel = !!errorView;

  function createErrorView(error: APIError) {
    if (error) {
      if (error.status === 403) {
        return (
          <IllustratedError
            title={t('ControlPlaneListWorkspaceGridTile.permissionErrorMessage')}
            details={t('ControlPlaneListWorkspaceGridTile.permissionErrorMessageSubtitle')}
            compact={true}
          />
        );
      } else {
        return <IllustratedError title={t('ControlPlaneListWorkspaceGridTile.loadingErrorMessage')} />;
      }
    }
    return null;
  }

  const uniqueMembers = useMemo(() => {
    const seenKeys = new Set<string>();
    const fallbackNamespace = workspace.status?.namespace ?? '';

    return (workspace.spec.members ?? []).filter((member: { name?: string; namespace?: string }) => {
      const memberNamespace = member?.namespace ?? fallbackNamespace;
      const memberName = String(member?.name ?? '')
        .trim()
        .toLowerCase();
      if (!memberName) return false;

      const dedupeKey = `${memberNamespace}::${memberName}`;
      if (seenKeys.has(dedupeKey)) return false;
      seenKeys.add(dedupeKey);
      return true;
    });
  }, [workspace.spec.members, workspace.status?.namespace]);

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
          style={{ maxWidth: '1280px', margin: '0px auto 0px auto', width: '100%' }}
          collapsed={shouldCollapsePanel}
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

              <CopyButton text={workspace.status?.namespace || '-'} style={{ justifyContent: 'start' }} />

              <MembersAvatarView members={uniqueMembers} project={projectName} workspace={workspaceName} />
              <FlexBox justifyContent={'SpaceBetween'} gap={10}>
                <YamlViewButton
                  variant="loader"
                  workspaceName={workspace.metadata.namespace}
                  resourceName={workspaceName}
                  resourceType={'workspaces'}
                />
                <ControlPlanesListMenu
                  setDialogDeleteWsIsOpen={setDialogDeleteWsIsOpen}
                  setIsCreateManagedControlPlaneWizardOpen={setIsCreateManagedControlPlaneWizardOpen}
                  setInitialTemplateName={setInitialTemplateName}
                />
              </FlexBox>
            </div>
          }
          noAnimation
        >
          {errorView ? (
            errorView
          ) : controlplanes?.length === 0 ? (
            <IllustratedBanner
              title={t('IllustratedBanner.titleMessage')}
              subtitle={t('IllustratedBanner.subtitleMessage')}
              illustrationName={IllustrationMessageType.NoData}
              compact
              help={{
                link: mcpCreationGuide,
                buttonText: t('IllustratedBanner.helpButton'),
              }}
              button={
                <Button
                  className={styles.createButton}
                  icon={'add'}
                  design={'Emphasized'}
                  onClick={() => {
                    setIsCreateManagedControlPlaneWizardOpen(true);
                  }}
                >
                  {t('ControlPlaneListToolbar.createNewManagedControlPlane')}
                </Button>
              }
            />
          ) : (
            <FlexBox wrap={'Wrap'} gap={'1rem'}>
              {controlplanes?.map((cp) => (
                <ControlPlaneCard
                  key={`${cp.metadata.name}--${cp.metadata.namespace}`}
                  controlPlane={cp}
                  projectName={projectName}
                  workspace={workspace}
                />
              ))}
            </FlexBox>
          )}
        </Panel>
      </ObjectPageSection>
      <DeleteConfirmationDialog
        resourceName={workspaceName}
        kubectl={<KubectlDeleteWorkspace projectName={projectName} resourceName={workspaceName} />}
        isOpen={dialogDeleteWsIsOpen}
        setIsOpen={setDialogDeleteWsIsOpen}
        onDeletionConfirmed={async () => {
          await trigger();
          toast.show(t('ControlPlaneListWorkspaceGridTile.deleteConfirmationDialog'));
        }}
      />
      {isCreateManagedControlPlaneWizardOpen ? (
        <CreateManagedControlPlaneWizardContainer
          isOpen={isCreateManagedControlPlaneWizardOpen}
          setIsOpen={setIsCreateManagedControlPlaneWizardOpen}
          projectName={projectNamespace}
          workspaceName={workspaceName}
          initialTemplateName={initialTemplateName}
          isEditMode={false}
        />
      ) : null}
    </>
  );
}
