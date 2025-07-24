import { describe, it, expect } from 'vitest';
import { projectWorkspaceNameRegex, managedControlPlaneNameRegex } from './regex';

describe('projectWorkspaceNameRegex', () => {
  const valid = [
    'Project1',
    'my-project',
    'A1-B2-C3',
    'abc.DEF-123',
    'a'.repeat(63),
    'abc.def.ghi',
    'A-1.b-2',
    'abc123',
    'abc-123.DEF',
  ];
  const invalid = [
    '-project',
    'project-',
    '.project',
    'project.',
    'a'.repeat(64),
    'abc..def',
    'abc.-def',
    'abc-.def',
    'abc_def',
    'abc@def',
  ];

  it('matches valid project or workspace names', () => {
    for (const name of valid) {
      expect(projectWorkspaceNameRegex.test(name)).toBe(true);
    }
  });

  it('does not match invalid project or workspace names', () => {
    for (const name of invalid) {
      expect(projectWorkspaceNameRegex.test(name)).toBe(false);
    }
  });
});

describe('managedControlPlaneNameRegex', () => {
  const valid = [
    'my-mcp',
    'abc123',
    'abc-123',
    'abc.def',
    'a'.repeat(63),
    'abc.def-ghi',
    'abc-123.def',
    'abc1-2.def3',
    'abc.def.ghi',
  ];
  const invalid = ['My-MCP', 'ABC', '-mcp', 'mcp-', '.mcp', 'mcp.', 'a'.repeat(64), 'abc..def', 'abc-.def', 'abc.-def'];

  it('matches valid managed control plane names', () => {
    for (const name of valid) {
      expect(managedControlPlaneNameRegex.test(name)).toBe(true);
    }
  });

  it('does not match invalid managed control plane names', () => {
    for (const name of invalid) {
      expect(managedControlPlaneNameRegex.test(name)).toBe(false);
    }
  });
});
