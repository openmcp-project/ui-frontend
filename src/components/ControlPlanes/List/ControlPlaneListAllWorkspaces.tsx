import { Button, FlexBox, IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteWorkspace as _useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { useMcpsQuery as _useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { useLink } from '../../../lib/shared/useLink.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';

const MAX_CONCURRENT_MEMBER_QUERIES = 3;

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
  // null = initial (auto-expand first accessible workspace); undefined = user explicitly collapsed all; string = user picked one
  const [expandedWorkspace, setExpandedWorkspace] = useState<string | null | undefined>(null);
  const [forbiddenWorkspaces, setForbiddenWorkspaces] = useState<Set<string>>(new Set());
  // How many workspaces have had their members query unlocked so far (sliding window cursor)
  const [membersUnlockedCount, setMembersUnlockedCount] = useState(MAX_CONCURRENT_MEMBER_QUERIES);

  const firstAccessible = workspaces.find((ws) => !forbiddenWorkspaces.has(ws.metadata.name))?.metadata.name ?? null;
  const resolvedExpanded = expandedWorkspace === null ? firstAccessible : expandedWorkspace;

  function handleForbidden(workspaceName: string) {
    setForbiddenWorkspaces((prev) => {
      if (prev.has(workspaceName)) return prev;
      return new Set(prev).add(workspaceName);
    });
  }

  function handleMembersLoaded() {
    setMembersUnlockedCount((prev) => Math.min(prev + 1, workspaces.length));
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
        workspaces.map((workspace, index) => (
          <ControlPlaneListWorkspaceGridTile
            key={`${projectName}-${workspace.metadata.name}`}
            projectName={projectName}
            workspace={workspace}
            isExpanded={resolvedExpanded === workspace.metadata.name}
            membersQueryEnabled={index < membersUnlockedCount}
            useMcpsQuery={useMcpsQuery}
            useDeleteWorkspace={useDeleteWorkspace}
            onToggleExpanded={() => {
              const isCurrentlyExpanded = resolvedExpanded === workspace.metadata.name;
              setExpandedWorkspace(isCurrentlyExpanded ? undefined : workspace.metadata.name);
            }}
            onForbidden={() => handleForbidden(workspace.metadata.name)}
            onMembersLoaded={handleMembersLoaded}
          />
        ))
      )}
    </>
  );
}
