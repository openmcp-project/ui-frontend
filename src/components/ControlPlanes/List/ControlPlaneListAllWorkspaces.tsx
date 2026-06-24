import { Button, FlexBox, IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoSearchResults.js';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteWorkspace as _useDeleteWorkspace } from '../../../spaces/onboarding/hooks/useDeleteWorkspace.ts';
import { useMcpsQuery as _useMcpsQuery } from '../../../spaces/onboarding/hooks/useMcpsQuery.ts';
import { useLink } from '../../../lib/shared/useLink.ts';
import { DISPLAY_NAME_ANNOTATION } from '../../../lib/api/types/shared/keyNames.ts';
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';

interface Props {
  projectName: string;
  workspaces: Workspace[];
  search?: string;
  useMcpsQuery?: typeof _useMcpsQuery;
  useDeleteWorkspace?: typeof _useDeleteWorkspace;
}

export default function ControlPlaneListAllWorkspaces({
  projectName,
  workspaces,
  search = '',
  useMcpsQuery = _useMcpsQuery,
  useDeleteWorkspace = _useDeleteWorkspace,
}: Props) {
  const { workspaceCreationGuide } = useLink();
  const { t } = useTranslation();
  // null = initial (auto-expand first accessible workspace); undefined = user explicitly collapsed all; string = user picked one
  const [expandedWorkspace, setExpandedWorkspace] = useState<string | null | undefined>(null);
  const [forbiddenWorkspaces, setForbiddenWorkspaces] = useState<Set<string>>(new Set());

  const query = search.trim().toLowerCase();

  const firstAccessible = workspaces.find((ws) => !forbiddenWorkspaces.has(ws.metadata.name))?.metadata.name ?? null;
  const resolvedExpanded = expandedWorkspace === null ? firstAccessible : expandedWorkspace;

  // Check if any workspace name/displayName matches — if none do, we show the
  // no-results state. CP-name matches are handled per-tile asynchronously.
  const anyWorkspaceNameMatches =
    !query ||
    workspaces.some((ws) => {
      const name = ws.metadata.name.toLowerCase();
      const dn = (ws.metadata.annotations?.[DISPLAY_NAME_ANNOTATION] ?? '').toLowerCase();
      return name.includes(query) || dn.includes(query);
    });

  function handleForbidden(workspaceName: string) {
    setForbiddenWorkspaces((prev) => {
      if (prev.has(workspaceName)) return prev;
      return new Set(prev).add(workspaceName);
    });
  }

  if (workspaces.length === 0) {
    return (
      <FlexBox direction="Column" alignItems="Center">
        <IllustratedMessage
          name="EmptyList"
          titleText={t('ControlPlaneListAllWorkspaces.emptyListTitleMessage')}
          subtitleText={t('ControlPlaneListAllWorkspaces.emptyListSubtitleMessage')}
        />
        <Button
          design={ButtonDesign.Emphasized}
          icon="sap-icon://question-mark"
          onClick={() => window.open(workspaceCreationGuide, '_blank')}
        >
          {t('IllustratedBanner.helpButton')}
        </Button>
      </FlexBox>
    );
  }

  return (
    <>
      {!anyWorkspaceNameMatches && (
        <FlexBox direction="Column" alignItems="Center">
          <IllustratedMessage
            name="NoSearchResults"
            titleText={t('ControlPlaneListAllWorkspaces.noSearchResultsTitle')}
            subtitleText={t('ControlPlaneListAllWorkspaces.noSearchResultsSubtitle')}
          />
        </FlexBox>
      )}
      {workspaces.map((workspace) => (
        <ControlPlaneListWorkspaceGridTile
          key={`${projectName}-${workspace.metadata.name}`}
          projectName={projectName}
          workspace={workspace}
          search={search}
          isExpanded={resolvedExpanded === workspace.metadata.name}
          useMcpsQuery={useMcpsQuery}
          useDeleteWorkspace={useDeleteWorkspace}
          onToggleExpanded={() => {
            const isCurrentlyExpanded = resolvedExpanded === workspace.metadata.name;
            setExpandedWorkspace(isCurrentlyExpanded ? undefined : workspace.metadata.name);
          }}
          onForbidden={() => handleForbidden(workspace.metadata.name)}
        />
      ))}
    </>
  );
}
