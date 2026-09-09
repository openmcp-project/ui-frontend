import { describe, it, expect, beforeEach } from 'vitest';
import { getExpandedWorkspaces, setExpandedWorkspaces } from './expandedWorkspace';

describe('expandedWorkspace', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty Set when nothing is stored', () => {
    expect(getExpandedWorkspaces('my-project').size).toBe(0);
  });

  it('stores and retrieves multiple workspace names per project', () => {
    setExpandedWorkspaces('my-project', new Set(['ws-dev', 'ws-prod']));
    const result = getExpandedWorkspaces('my-project');
    expect(result.has('ws-dev')).toBe(true);
    expect(result.has('ws-prod')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('stores independently per project', () => {
    setExpandedWorkspaces('project-a', new Set(['ws-dev']));
    setExpandedWorkspaces('project-b', new Set(['ws-prod']));
    expect(getExpandedWorkspaces('project-a').has('ws-dev')).toBe(true);
    expect(getExpandedWorkspaces('project-b').has('ws-prod')).toBe(true);
  });

  it('overwrites previous value for the same project', () => {
    setExpandedWorkspaces('my-project', new Set(['ws-dev']));
    setExpandedWorkspaces('my-project', new Set(['ws-prod']));
    const result = getExpandedWorkspaces('my-project');
    expect(result.has('ws-dev')).toBe(false);
    expect(result.has('ws-prod')).toBe(true);
  });

  it('removes the key when an empty Set is stored', () => {
    setExpandedWorkspaces('my-project', new Set(['ws-dev']));
    setExpandedWorkspaces('my-project', new Set());
    expect(localStorage.getItem('expandedWorkspaces:my-project')).toBeNull();
    expect(getExpandedWorkspaces('my-project').size).toBe(0);
  });

  it('clearing one project does not affect another', () => {
    setExpandedWorkspaces('project-a', new Set(['ws-dev']));
    setExpandedWorkspaces('project-b', new Set(['ws-prod']));
    setExpandedWorkspaces('project-a', new Set());
    expect(getExpandedWorkspaces('project-b').has('ws-prod')).toBe(true);
  });
});
