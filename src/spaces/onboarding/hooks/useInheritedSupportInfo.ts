import { useMemo } from 'react';
import {
  ResolvedSupportInfo,
  resolveSupportInfo,
  SupportInfo,
  SupportInfoCandidate,
} from '../../../lib/supportInfo.ts';
import { useGetWorkspace as _useGetWorkspace } from './useGetWorkspace.ts';
import { useProjectMembers as _useProjectMembers } from './useProjectMembers.ts';

interface Options {
  projectName?: string;
  workspaceName?: string;
  useGetWorkspace?: typeof _useGetWorkspace;
  useProjectMembers?: typeof _useProjectMembers;
}

/** Fetches the parent workspace/project support info and resolves `own` against it (nearest wins). */
export function useInheritedSupportInfo(
  own: SupportInfo,
  { projectName, workspaceName, useGetWorkspace = _useGetWorkspace, useProjectMembers = _useProjectMembers }: Options,
): ResolvedSupportInfo & { isLoading: boolean } {
  const workspace = useGetWorkspace(workspaceName, projectName ? `project-${projectName}` : undefined);
  const project = useProjectMembers(projectName);

  const { supportLandscape, supportServiceIds, supportSecurityContacts, supportOpsContacts } = own;
  const workspaceInfo = workspace.workspaceData;
  const resolved = useMemo(() => {
    const parents: SupportInfoCandidate[] = [];
    if (workspaceName && workspaceInfo) {
      parents.push({
        kind: 'Workspace',
        name: workspaceName,
        info: {
          supportLandscape: workspaceInfo.supportLandscape,
          supportServiceIds: workspaceInfo.supportServiceIds,
          supportSecurityContacts: workspaceInfo.supportSecurityContacts,
          supportOpsContacts: workspaceInfo.supportOpsContacts,
        },
      });
    }
    if (projectName) {
      parents.push({
        kind: 'Project',
        name: projectName,
        info: {
          supportLandscape: project.supportLandscape,
          supportServiceIds: project.supportServiceIds,
          supportSecurityContacts: project.supportSecurityContacts,
          supportOpsContacts: project.supportOpsContacts,
        },
      });
    }
    return resolveSupportInfo(
      { supportLandscape, supportServiceIds, supportSecurityContacts, supportOpsContacts },
      parents,
    );
  }, [
    supportLandscape,
    supportServiceIds,
    supportSecurityContacts,
    supportOpsContacts,
    workspaceName,
    workspaceInfo,
    projectName,
    project.supportLandscape,
    project.supportServiceIds,
    project.supportSecurityContacts,
    project.supportOpsContacts,
  ]);

  return { ...resolved, isLoading: workspace.isLoading || project.isLoading };
}
