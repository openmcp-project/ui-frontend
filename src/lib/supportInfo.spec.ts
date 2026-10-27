import { describe, expect, it } from 'vitest';
import { hasSupportInfo, resolveSupportInfo } from './supportInfo.ts';

describe('hasSupportInfo', () => {
  it('is false for undefined, empty, and whitespace-only values', () => {
    expect(hasSupportInfo(undefined)).toBe(false);
    expect(hasSupportInfo({})).toBe(false);
    expect(hasSupportInfo({ supportServiceIds: '   ' })).toBe(false);
  });

  it('is true when any single field is set', () => {
    expect(hasSupportInfo({ supportOpsContacts: 'mail:ops@example.com' })).toBe(true);
  });
});

describe('resolveSupportInfo', () => {
  const workspace = { kind: 'Workspace' as const, name: 'ws-1', info: { supportLandscape: 'staging' } };
  const project = { kind: 'Project' as const, name: 'proj-1', info: { supportLandscape: 'production' } };

  it('uses own info and reports no source when the resource sets any field', () => {
    const own = { supportServiceIds: 'ID-1' };
    expect(resolveSupportInfo(own, [workspace, project])).toEqual({ info: own });
  });

  it('inherits the whole block from the nearest parent that has info', () => {
    expect(resolveSupportInfo({}, [workspace, project])).toEqual({
      info: workspace.info,
      inheritedFrom: { kind: 'Workspace', name: 'ws-1' },
    });
  });

  it('skips empty parents and falls through to the next one', () => {
    const emptyWorkspace = { ...workspace, info: {} };
    expect(resolveSupportInfo({}, [emptyWorkspace, project])).toEqual({
      info: project.info,
      inheritedFrom: { kind: 'Project', name: 'proj-1' },
    });
  });

  it('returns own (empty) info when no level has any', () => {
    expect(resolveSupportInfo({}, [{ ...project, info: {} }])).toEqual({ info: {} });
  });
});
