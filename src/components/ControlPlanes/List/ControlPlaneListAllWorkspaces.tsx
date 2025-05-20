import { Button, FlexBox, IllustratedMessage } from '@ui5/webcomponents-react';
import IllustratedError from '../../Shared/IllustratedError.tsx';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import Loading from '../../Shared/Loading.tsx';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';
import { useApiResource } from '../../../lib/api/useApiResource.ts';
import { ListWorkspaces } from '../../../lib/api/types/crate/listWorkspaces.ts';
import { useLink } from '../../../lib/shared/useLink.ts';
import { useTranslation } from 'react-i18next';

interface Props {
  projectName: string;
}

export default function ControlPlaneListAllWorkspaces({ projectName }: Props) {
  const { workspaceCreationGuide } = useLink();
  const { data: allWorkspaces, error } = useApiResource(
    ListWorkspaces(projectName),
  );

  const { t } = useTranslation();

  if (!allWorkspaces) {
    return <Loading />;
  }
  if (error) {
    return <IllustratedError details={error.message} />;
  }

  return (
    <>
      {allWorkspaces.length === 0 ? (
        <FlexBox direction="Column" alignItems="Center">
          <IllustratedMessage
            name="EmptyList"
            titleText={t('ControlPlaneListAllWorkspaces.emptyListTitleMessage')}
            subtitleText={t(
              'ControlPlaneListAllWorkspaces.emptyListSubtitleMessage',
            )}
          />
          <Button
            design={ButtonDesign.Emphasized}
            icon="sap-icon://question-mark"
            onClick={() => {
              window.open(workspaceCreationGuide, '_blank');
            }}
          >
            Help
          </Button>
        </FlexBox>
      ) : (
        allWorkspaces.map((workspace) => (
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
