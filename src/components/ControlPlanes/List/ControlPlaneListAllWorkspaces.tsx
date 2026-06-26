import { Button, FlexBox, IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/collapse-all.js';
import '@ui5/webcomponents-icons/dist/expand-all.js';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteWorkspace as _useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { useMcpsQuery as _useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { useLink } from '../../../lib/shared/useLink.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';
import { getExpandedWorkspaces, setExpandedWorkspaces } from '../../../utils/expandedWorkspace.ts';

interface Props {
  projectName: string;
  workspaces: Workspace[];
  useMcpsQuery?: typeof _useMcpsQuery;
  useDeleteWorkspace?: typeof _useDeleteWorkspace;
}

export default function ControlPlaneListAllWorkspaces({
  projectName,
  workspaces,
  useMcpsQuery = _useMcpsQuery,
  useDeleteWorkspace = _useDeleteWorkspace,
}: Props) {
  const { workspaceCreationGuide } = useLink();
  const { t } = useTranslation();

  const [expandedWorkspaces, setExpanded] = useState<Set<string>>(() => getExpandedWorkspaces(projectName));

  useEffect(() => {
    setExpandedWorkspaces(projectName, expandedWorkspaces);
  }, [projectName, expandedWorkspaces]);

  function handleToggle(workspaceName: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceName)) {
        next.delete(workspaceName);
      } else {
        next.add(workspaceName);
      }
      return next;
    });
  }

  function handleExpandAll() {
    setExpanded(new Set(workspaces.map((ws) => ws.metadata.name)));
  }

  function handleCollapseAll() {
    setExpanded(new Set());
  }

  const allExpanded = workspaces.length > 0 && workspaces.every((ws) => expandedWorkspaces.has(ws.metadata.name));

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
        <>
          <FlexBox
            justifyContent="End"
            style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', marginBottom: '0.5rem' }}
          >
            {allExpanded ? (
              <Button
                design="Transparent"
                icon="collapse-all"
                tooltip={t('ControlPlaneListAllWorkspaces.collapseAll')}
                onClick={handleCollapseAll}
              >
                {t('ControlPlaneListAllWorkspaces.collapseAll')}
              </Button>
            ) : (
              <Button
                design="Transparent"
                icon="expand-all"
                tooltip={t('ControlPlaneListAllWorkspaces.expandAll')}
                onClick={handleExpandAll}
              >
                {t('ControlPlaneListAllWorkspaces.expandAll')}
              </Button>
            )}
          </FlexBox>
          {workspaces.map((workspace) => (
            <ControlPlaneListWorkspaceGridTile
              key={`${projectName}-${workspace.metadata.name}`}
              projectName={projectName}
              workspace={workspace}
              isExpanded={expandedWorkspaces.has(workspace.metadata.name)}
              useMcpsQuery={useMcpsQuery}
              useDeleteWorkspace={useDeleteWorkspace}
              onToggleExpanded={() => handleToggle(workspace.metadata.name)}
            />
          ))}
        </>
      )}
    </>
  );
}
