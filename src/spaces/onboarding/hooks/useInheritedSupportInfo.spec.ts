import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInheritedSupportInfo } from './useInheritedSupportInfo';
import type { WorkspaceData } from './useGetWorkspace';

const noInfo = { supportLandscape: '', supportServiceIds: '', supportSecurityContacts: '', supportOpsContacts: '' };

function makeUseGetWorkspace(data?: Partial<WorkspaceData>) {
  return () => ({
    workspaceData: data
      ? ({
          ...noInfo,
          name: 'ws',
          namespace: 'ns',
          displayName: '',
          chargingTarget: '',
          chargingTargetType: '',
          members: [],
          ...data,
        } as WorkspaceData)
      : undefined,
    isLoading: false,
    error: undefined,
  });
}

function makeUseProjectMembers(support?: {
  supportLandscape?: string;
  supportServiceIds?: string;
  supportSecurityContacts?: string;
  supportOpsContacts?: string;
}) {
  return () => ({
    members: [],
    displayName: '',
    creationTimestamp: undefined,
    isLoading: false,
    ...noInfo,
    ...support,
  });
}

describe('useInheritedSupportInfo', () => {
  it('returns own info when it is set, with no inheritedFrom', () => {
    const own = { supportLandscape: 'production', supportServiceIds: 'OWN-1' };
    const { result } = renderHook(() =>
      useInheritedSupportInfo(own, {
        projectName: 'proj',
        workspaceName: 'ws',
        useGetWorkspace: makeUseGetWorkspace({ supportLandscape: 'staging' }),
        useProjectMembers: makeUseProjectMembers({ supportLandscape: 'development' }),
      }),
    );

    expect(result.current.info.supportLandscape).toBe('production');
    expect(result.current.inheritedFrom).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('inherits from workspace when own info is empty and workspace has info', () => {
    const { result } = renderHook(() =>
      useInheritedSupportInfo(
        {},
        {
          projectName: 'proj',
          workspaceName: 'my-ws',
          useGetWorkspace: makeUseGetWorkspace({ supportLandscape: 'staging', supportServiceIds: 'WS-42' }),
          useProjectMembers: makeUseProjectMembers({ supportLandscape: 'development' }),
        },
      ),
    );

    expect(result.current.info.supportLandscape).toBe('staging');
    expect(result.current.info.supportServiceIds).toBe('WS-42');
    expect(result.current.inheritedFrom).toEqual({ kind: 'Workspace', name: 'my-ws' });
  });

  it('inherits from project when own info and workspace info are both empty', () => {
    const { result } = renderHook(() =>
      useInheritedSupportInfo(
        {},
        {
          projectName: 'my-proj',
          workspaceName: 'ws',
          useGetWorkspace: makeUseGetWorkspace(),
          useProjectMembers: makeUseProjectMembers({ supportLandscape: 'development', supportServiceIds: 'PROJ-7' }),
        },
      ),
    );

    expect(result.current.info.supportLandscape).toBe('development');
    expect(result.current.info.supportServiceIds).toBe('PROJ-7');
    expect(result.current.inheritedFrom).toEqual({ kind: 'Project', name: 'my-proj' });
  });

  it('returns empty info with no inheritedFrom when all levels are empty', () => {
    const { result } = renderHook(() =>
      useInheritedSupportInfo(
        {},
        {
          projectName: 'proj',
          workspaceName: 'ws',
          useGetWorkspace: makeUseGetWorkspace(),
          useProjectMembers: makeUseProjectMembers(),
        },
      ),
    );

    expect(result.current.info).toEqual({});
    expect(result.current.inheritedFrom).toBeUndefined();
  });

  it('inherits from workspace even when only non-landscape fields are set (no supportLandscape)', () => {
    const { result } = renderHook(() =>
      useInheritedSupportInfo(
        {},
        {
          projectName: 'proj',
          workspaceName: 'my-ws',
          useGetWorkspace: makeUseGetWorkspace({ supportServiceIds: 'WS-ONLY' }),
          useProjectMembers: makeUseProjectMembers({ supportLandscape: 'development' }),
        },
      ),
    );

    expect(result.current.info.supportServiceIds).toBe('WS-ONLY');
    expect(result.current.info.supportLandscape).toBe('');
    expect(result.current.inheritedFrom).toEqual({ kind: 'Workspace', name: 'my-ws' });
  });

  it('resolves without workspace when workspaceName is not provided', () => {
    const { result } = renderHook(() =>
      useInheritedSupportInfo(
        {},
        {
          projectName: 'my-proj',
          useGetWorkspace: makeUseGetWorkspace({ supportLandscape: 'staging' }),
          useProjectMembers: makeUseProjectMembers({ supportLandscape: 'development' }),
        },
      ),
    );

    expect(result.current.inheritedFrom).toEqual({ kind: 'Project', name: 'my-proj' });
    expect(result.current.info.supportLandscape).toBe('development');
  });

  it('reports isLoading true while workspace is loading', () => {
    const { result } = renderHook(() =>
      useInheritedSupportInfo(
        {},
        {
          projectName: 'proj',
          workspaceName: 'ws',
          useGetWorkspace: () => ({ workspaceData: undefined, isLoading: true, error: undefined }),
          useProjectMembers: makeUseProjectMembers(),
        },
      ),
    );

    expect(result.current.isLoading).toBe(true);
  });
});
