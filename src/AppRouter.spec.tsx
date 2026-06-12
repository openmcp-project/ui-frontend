import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, Navigate, useParams } from 'react-router-dom';

// Minimal redirect components mirroring AppRouter — tested in isolation so we
// don't need to mount the full app tree with all its providers.

function RedirectProject() {
  const { projectName } = useParams();
  return <Navigate replace to={`/projects/${projectName}`} />;
}

function RedirectMcp() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  return <Navigate replace to={`/projects/${projectName}/workspaces/${workspaceName}/mcps/${controlPlaneName}`} />;
}

function RedirectMcpV2() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  return <Navigate replace to={`/projects/${projectName}/workspaces/${workspaceName}/mcpsv2/${controlPlaneName}`} />;
}

function RedirectMcpV2Headlamp() {
  const { projectName, workspaceName, controlPlaneName } = useParams();
  return (
    <Navigate replace to={`/projects/${projectName}/workspaces/${workspaceName}/mcpsv2/${controlPlaneName}/headlamp`} />
  );
}

function PathCapture({ onCapture }: { onCapture: (path: string) => void }) {
  const path = (useParams() as any)['*'] ?? '';
  onCapture(`/${path}`);
  return null;
}

function resolveRedirect(from: string): string {
  let resolved = from;

  render(
    <MemoryRouter initialEntries={[from]}>
      <Routes>
        <Route path="/mcp/projects" element={<Navigate replace to="/projects" />} />
        <Route path="/mcp/projects/:projectName" element={<RedirectProject />} />
        <Route
          path="/mcp/projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName/headlamp"
          element={<RedirectMcpV2Headlamp />}
        />
        <Route
          path="/mcp/projects/:projectName/workspaces/:workspaceName/mcpsv2/:controlPlaneName"
          element={<RedirectMcpV2 />}
        />
        <Route
          path="/mcp/projects/:projectName/workspaces/:workspaceName/mcps/:controlPlaneName"
          element={<RedirectMcp />}
        />
        <Route
          path="*"
          element={
            <PathCapture
              onCapture={(p) => {
                resolved = p;
              }}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  return resolved;
}

describe('legacy /mcp/* redirect backward compatibility', () => {
  it('/mcp/projects redirects to /projects', () => {
    expect(resolveRedirect('/mcp/projects')).toBe('/projects');
  });

  it('/mcp/projects/:projectName redirects to /projects/:projectName', () => {
    expect(resolveRedirect('/mcp/projects/my-project')).toBe('/projects/my-project');
  });

  it('/mcp/projects/:p/workspaces/:w/mcps/:c redirects to /projects/:p/workspaces/:w/mcps/:c', () => {
    expect(resolveRedirect('/mcp/projects/my-project/workspaces/my-workspace/mcps/my-mcp')).toBe(
      '/projects/my-project/workspaces/my-workspace/mcps/my-mcp',
    );
  });

  it('/mcp/projects/:p/workspaces/:w/mcpsv2/:c redirects to /projects/:p/workspaces/:w/mcpsv2/:c', () => {
    expect(resolveRedirect('/mcp/projects/my-project/workspaces/my-workspace/mcpsv2/my-mcp')).toBe(
      '/projects/my-project/workspaces/my-workspace/mcpsv2/my-mcp',
    );
  });

  it('/mcp/projects/:p/workspaces/:w/mcpsv2/:c/headlamp redirects to /projects/:p/workspaces/:w/mcpsv2/:c/headlamp', () => {
    expect(resolveRedirect('/mcp/projects/my-project/workspaces/my-workspace/mcpsv2/my-mcp/headlamp')).toBe(
      '/projects/my-project/workspaces/my-workspace/mcpsv2/my-mcp/headlamp',
    );
  });
});
