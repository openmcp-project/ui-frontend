import { describe, it, expect, beforeEach } from 'vitest';
import { getExpandedWorkspace, setExpandedWorkspace } from './expandedWorkspace';

describe('expandedWorkspace', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(getExpandedWorkspace('my-project')).toBeNull();
  });

  it('stores and retrieves a workspace name', () => {
    setExpandedWorkspace('my-project', 'ws-dev');
    expect(getExpandedWorkspace('my-project')).toBe('ws-dev');
  });

  it('overwrites previous value for the same project', () => {
    setExpandedWorkspace('my-project', 'ws-dev');
    setExpandedWorkspace('my-project', 'ws-prod');
    expect(getExpandedWorkspace('my-project')).toBe('ws-prod');
  });

  it('removes the key when null is stored', () => {
    setExpandedWorkspace('my-project', 'ws-dev');
    setExpandedWorkspace('my-project', null);
    expect(localStorage.getItem('expandedWorkspace:my-project')).toBeNull();
    expect(getExpandedWorkspace('my-project')).toBeNull();
  });

  it('stores independently per project', () => {
    setExpandedWorkspace('project-a', 'ws-dev');
    setExpandedWorkspace('project-b', 'ws-prod');
    expect(getExpandedWorkspace('project-a')).toBe('ws-dev');
    expect(getExpandedWorkspace('project-b')).toBe('ws-prod');
  });

  it('clearing one project does not affect another', () => {
    setExpandedWorkspace('project-a', 'ws-dev');
    setExpandedWorkspace('project-b', 'ws-prod');
    setExpandedWorkspace('project-a', null);
    expect(getExpandedWorkspace('project-b')).toBe('ws-prod');
  });
});
