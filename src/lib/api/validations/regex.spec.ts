import { describe, it, expect } from 'vitest';
import {
  projectWorkspaceNameRegex,
  managedControlPlaneNameRegex,
  oidcProviderNameRegex,
  oidcIssuerUrlRegex,
} from './regex';

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

describe('oidcProviderNameRegex', () => {
  // Note: the pattern itself carries no length limit (the CRD's maxLength: 253 is a separate
  // constraint, enforced via zod .max() in mcpV2Input.schema.ts, not embedded in this regex).
  const valid = ['custom', 'my-idp', 'idp1', 'abc.def', 'a'.repeat(300)];
  const invalid = ['-idp', 'idp-', '.idp', 'idp.', 'Custom', 'abc_def', 'abc@def', ''];

  it('matches valid OIDC provider names', () => {
    for (const name of valid) {
      expect(oidcProviderNameRegex.test(name)).toBe(true);
    }
  });

  it('does not match invalid OIDC provider names', () => {
    for (const name of invalid) {
      expect(oidcProviderNameRegex.test(name)).toBe(false);
    }
  });
});

describe('oidcIssuerUrlRegex', () => {
  const valid = ['https://openmcp.accounts.ondemand.com', 'http://example.com/issuer', 'https://example.com:8443/path'];
  const invalid = ['ftp://example.com', 'example.com', 'https://', 'not-a-url', ''];

  it('matches valid issuer URLs', () => {
    for (const url of valid) {
      expect(oidcIssuerUrlRegex.test(url)).toBe(true);
    }
  });

  it('does not match invalid issuer URLs', () => {
    for (const url of invalid) {
      expect(oidcIssuerUrlRegex.test(url)).toBe(false);
    }
  });
});
