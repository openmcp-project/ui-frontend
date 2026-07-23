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
import { Workspace } from '../../../spaces/onboarding/types/Workspace.ts';
import { ControlPlaneListWorkspaceGridTile } from './ControlPlaneListWorkspaceGridTile.tsx';

interface Props {
  projectName: string;
  workspaces: Workspace[];
  search?: string;
  expandedWorkspaces: Set<string>;
  onToggleWorkspace: (workspaceName: string) => void;
  onControlPlanesLoaded?: (cps: { name: string; namespace: string }[]) => void;
  useMcpsQuery?: typeof _useMcpsQuery;
  useDeleteWorkspace?: typeof _useDeleteWorkspace;
}

export default function ControlPlaneListAllWorkspaces({
  projectName,
  workspaces,
  search = '',
  expandedWorkspaces,
  onToggleWorkspace,
  onControlPlanesLoaded,
  useMcpsQuery = _useMcpsQuery,
  useDeleteWorkspace = _useDeleteWorkspace,
}: Props) {
  const { workspaceCreationGuide } = useLink();
  const { t } = useTranslation();

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
      {workspaces.map((workspace) => (
        <ControlPlaneListWorkspaceGridTile
          key={`${projectName}-${workspace.metadata.name}`}
          projectName={projectName}
          workspace={workspace}
          search={search}
          isExpanded={expandedWorkspaces.has(workspace.metadata.name)}
          useMcpsQuery={useMcpsQuery}
          useDeleteWorkspace={useDeleteWorkspace}
          onToggleExpanded={() => onToggleWorkspace(workspace.metadata.name)}
          onVisibilityChange={(isVisible) => handleVisibilityChange(workspace.metadata.name, isVisible)}
          onControlPlanesLoaded={onControlPlanesLoaded}
        />
      ))}
    </>
  );
}
