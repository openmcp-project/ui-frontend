import { Button, FlexBox, ObjectPageSection, Panel, Title } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import { CopyButton } from '../../Shared/CopyButton.tsx';
import { ControlPlaneCard } from '../ControlPlaneCard/ControlPlaneCard.tsx';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { useMemo, useState } from 'react';
import { MembersAvatarView } from './MembersAvatarView.tsx';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { DeleteConfirmationDialog } from '../../Dialogs/DeleteConfirmationDialog.tsx';
import { DeleteWorkspaceDialog } from '../../Dialogs/KubectlCommandInfo/KubectlDeleteWorkspaceDialog.tsx';
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
import { useDeleteWorkspace as _useDeleteWorkspace } from '../../../hooks/useDeleteWorkspace.ts';
import { useManagedControlPlanesQuery as _useManagedControlPlanesQuery } from '../../../hooks/useManagedControlPlanesQuery.ts';

interface Props {
  projectName: string;
  workspace: Workspace;
  useManagedControlPlanesQuery?: typeof _useManagedControlPlanesQuery;
  useDeleteWorkspace?: typeof _useDeleteWorkspace;
}

export function ControlPlaneListWorkspaceGridTile({
  projectName,
  workspace,
  useManagedControlPlanesQuery = _useManagedControlPlanesQuery,
  useDeleteWorkspace = _useDeleteWorkspace,
}: Props) {
  const [isCreateManagedControlPlaneWizardOpen, setIsCreateManagedControlPlaneWizardOpen] = useState(false);
  const [initialTemplateName, setInitialTemplateName] = useState<string | undefined>(undefined);
  const workspaceName = workspace.metadata.name;
  const workspaceDisplayName = workspace.metadata.annotations?.[DISPLAY_NAME_ANNOTATION] || '';
  const showDisplayName = workspaceDisplayName.length > 0;
  const projectNamespace = workspace.metadata.namespace;

  const { t } = useTranslation();

  const [dialogDeleteWsIsOpen, setDialogDeleteWsIsOpen] = useState(false);

  const { managedControlPlanes, error: cpsError } = useManagedControlPlanesQuery(projectName, workspaceName);
  const { deleteWorkspace } = useDeleteWorkspace(projectNamespace, workspaceName);

  const { mcpCreationGuide } = useLink();
  const errorView = createErrorView(cpsError);
  const shouldCollapsePanel = !!errorView;

  function isWorkspaceReady(currentWorkspace: Workspace): boolean {
    return currentWorkspace.status != null && currentWorkspace.status.namespace != null;
  }

  function createErrorView(error: APIError | undefined) {
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
          ) : managedControlPlanes?.length === 0 ? (
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
            <div className={styles.wrapper}>
              <div className={styles.grid}>
                {managedControlPlanes?.map((mcp) => (
                  <ControlPlaneCard
                    key={`${mcp.metadata.name}--${mcp.metadata.namespace}`}
                    controlPlane={mcp}
                    projectName={projectName}
                    workspace={workspace}
                  />
                ))}
              </div>
            </div>
          )}
        </Panel>
      </ObjectPageSection>
      <DeleteConfirmationDialog
        resourceName={workspaceName}
        kubectlDialog={({ isOpen, onClose }) => (
          <DeleteWorkspaceDialog
            projectName={projectName}
            resourceName={workspaceName}
            isOpen={isOpen}
            onClose={onClose}
          />
        )}
        isOpen={dialogDeleteWsIsOpen}
        setIsOpen={setDialogDeleteWsIsOpen}
        onDeletionConfirmed={deleteWorkspace}
      />
      {isCreateManagedControlPlaneWizardOpen ? (
        <CreateManagedControlPlaneWizardContainer
          isOpen={isCreateManagedControlPlaneWizardOpen}
          setIsOpen={setIsCreateManagedControlPlaneWizardOpen}
          projectName={projectNamespace}
          workspaceName={workspaceName}
          initialTemplateName={initialTemplateName}
        />
      ) : null}
    </>
  );
}
