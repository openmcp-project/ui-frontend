import { Button, FlexBox, IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoSearchResults.js';
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

  // Per-project persisted set of expanded workspace names — each workspace
  // can be expanded/collapsed independently.
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

  // Below: search / no-results / forbidden-workspace tracking merged in
  // from main. Kept independent from the expanded-set state above.
  const [forbiddenWorkspaces, setForbiddenWorkspaces] = useState<Set<string>>(new Set());
  const query = search.trim().toLowerCase();

  const [visibilityState, setVisibilityState] = useState<{ query: string; map: Record<string, boolean> }>({
    query: '',
    map: {},
  });

  // Entries from a previous query are discarded by treating them as an empty map.
  const visibilityMap = visibilityState.query === query ? visibilityState.map : {};
  const allSettled = Object.keys(visibilityMap).length === workspaces.length;
  const showNoResults = !!query && allSettled && !Object.values(visibilityMap).some(Boolean);

  function handleVisibilityChange(workspaceName: string, isVisible: boolean) {
    setVisibilityState((prev) => {
      const currentMap = prev.query === query ? prev.map : {};
      if (currentMap[workspaceName] === isVisible) return prev;
      return { query, map: { ...currentMap, [workspaceName]: isVisible } };
    });
  }

  function handleForbidden(workspaceName: string) {
    setForbiddenWorkspaces((prev) => {
      if (prev.has(workspaceName)) return prev;
      return new Set(prev).add(workspaceName);
    });
  }
  // `forbiddenWorkspaces` is currently only written here — kept as state so
  // the setter has a stable identity for the per-tile callback below.
  void forbiddenWorkspaces;

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
      {showNoResults && (
        <FlexBox direction="Column" alignItems="Center">
          <IllustratedMessage
            name="NoSearchResults"
            titleText={t('ControlPlaneListAllWorkspaces.noSearchResultsTitle')}
            subtitleText={t('ControlPlaneListAllWorkspaces.noSearchResultsSubtitle')}
          />
        </FlexBox>
      )}
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
          search={search}
          isExpanded={expandedWorkspaces.has(workspace.metadata.name)}
          useMcpsQuery={useMcpsQuery}
          useDeleteWorkspace={useDeleteWorkspace}
          onToggleExpanded={() => handleToggle(workspace.metadata.name)}
          onForbidden={() => handleForbidden(workspace.metadata.name)}
          onVisibilityChange={(isVisible) => handleVisibilityChange(workspace.metadata.name, isVisible)}
        />
      ))}
    </>
  );
}
