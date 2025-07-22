import { Button, FlexBox, IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';
import { ListWorkspacesType } from '../../../lib/api/types/crate/listWorkspaces.ts';
import { useLink } from '../../../lib/shared/useLink.ts';
import { useTranslation } from 'react-i18next';

interface Props {
  projectName: string;
  workspaces: ListWorkspacesType[];
}

export default function ControlPlaneListAllWorkspaces({ projectName, workspaces }: Props) {
  const { workspaceCreationGuide } = useLink();

  const { t } = useTranslation();

  return (
    <>
      {workspaces.length === 0 ? (
        <FlexBox direction="Column" alignItems="Center">
          <IllustratedMessage
            name="EmptyList"
            titleText={t('ControlPlaneListAllWorkspaces.emptyListTitleMessage')}
            subtitleText={t('ControlPlaneListAllWorkspaces.emptyListSubtitleMessage')}
          />
          <Button
            design={ButtonDesign.Emphasized}
            icon="sap-icon://question-mark"
            onClick={() => {
              window.open(workspaceCreationGuide, '_blank');
            }}
          >
            {t('IllustratedBanner.helpButton')}
          </Button>
        </FlexBox>
      ) : (
        workspaces.map((workspace) => (
          <ControlPlaneListWorkspaceGridTile
            key={`${projectName}-${workspace.metadata.name}`}
            projectName={projectName}
            workspace={workspace}
          />
        ))
      )}
    </>
  );
}
