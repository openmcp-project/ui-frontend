import { describe, it, expect, beforeEach } from 'vitest';
import { getExpandedWorkspace, setExpandedWorkspace, clearExpandedWorkspace } from './expandedWorkspace';

describe('expandedWorkspace', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(getExpandedWorkspace('my-project')).toBeNull();
  });

  it('stores and retrieves a workspace name per project', () => {
    setExpandedWorkspace('my-project', 'ws-dev');
    expect(getExpandedWorkspace('my-project')).toBe('ws-dev');
  });

  it('stores independently per project', () => {
    setExpandedWorkspace('project-a', 'ws-dev');
    setExpandedWorkspace('project-b', 'ws-prod');
    expect(getExpandedWorkspace('project-a')).toBe('ws-dev');
    expect(getExpandedWorkspace('project-b')).toBe('ws-prod');
  });

  it('overwrites previous value for the same project', () => {
    setExpandedWorkspace('my-project', 'ws-dev');
    setExpandedWorkspace('my-project', 'ws-prod');
    expect(getExpandedWorkspace('my-project')).toBe('ws-prod');
  });

  it('returns null after clearing', () => {
    setExpandedWorkspace('my-project', 'ws-dev');
    clearExpandedWorkspace('my-project');
    expect(getExpandedWorkspace('my-project')).toBeNull();
  });

  it('clearing one project does not affect another', () => {
    setExpandedWorkspace('project-a', 'ws-dev');
    setExpandedWorkspace('project-b', 'ws-prod');
    clearExpandedWorkspace('project-a');
    expect(getExpandedWorkspace('project-b')).toBe('ws-prod');
  });
});
