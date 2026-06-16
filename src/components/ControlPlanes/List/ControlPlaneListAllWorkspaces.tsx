import { Button, FlexBox, IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteWorkspace as _useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { useMcpsQuery as _useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { useLink } from '../../../lib/shared/useLink.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';
import {
  getExpandedWorkspace,
  setExpandedWorkspace as persistExpandedWorkspace,
  clearExpandedWorkspace,
} from '../../../utils/expandedWorkspace.ts';

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
  const [forbiddenWorkspaces, setForbiddenWorkspaces] = useState<Set<string>>(new Set());

  const [expandedWorkspace, setExpandedWorkspace] = useState<string | null | undefined>(
    () => getExpandedWorkspace(projectName), // null if nothing stored
  );

  const firstAccessible = workspaces.find((ws) => !forbiddenWorkspaces.has(ws.metadata.name))?.metadata.name ?? null;

  // If the stored workspace no longer exists in the list, fall back to first accessible
  const storedStillExists =
    expandedWorkspace != null && workspaces.some((ws) => ws.metadata.name === expandedWorkspace);
  const resolvedExpanded = expandedWorkspace == null || !storedStillExists ? firstAccessible : expandedWorkspace;

  // Persist whichever workspace ends up expanded so it survives navigation
  useEffect(() => {
    if (resolvedExpanded) {
      persistExpandedWorkspace(projectName, resolvedExpanded);
    } else {
      clearExpandedWorkspace(projectName);
    }
  }, [projectName, resolvedExpanded]);

  function handleForbidden(workspaceName: string) {
    setForbiddenWorkspaces((prev) => {
      if (prev.has(workspaceName)) return prev;
      return new Set(prev).add(workspaceName);
    });
  }

  function handleToggle(workspaceName: string) {
    const isCurrentlyExpanded = resolvedExpanded === workspaceName;
    if (isCurrentlyExpanded) {
      setExpandedWorkspace(undefined);
      clearExpandedWorkspace(projectName);
    } else {
      setExpandedWorkspace(workspaceName);
      persistExpandedWorkspace(projectName, workspaceName);
    }
  }

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
            isExpanded={resolvedExpanded === workspace.metadata.name}
            useMcpsQuery={useMcpsQuery}
            useDeleteWorkspace={useDeleteWorkspace}
            onToggleExpanded={() => handleToggle(workspace.metadata.name)}
            onForbidden={() => handleForbidden(workspace.metadata.name)}
          />
        ))
      )}
    </>
  );
}
