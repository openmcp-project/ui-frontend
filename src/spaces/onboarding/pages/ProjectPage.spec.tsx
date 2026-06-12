import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProjectPage from './ProjectPage';
import { setRememberedProject, getRememberedProject, clearRememberedProject } from '../../../utils/rememberedProject';
import { useWorkspacesQuery } from '../hooks/useWorkspacesQuery';
import { APIError } from '../../../lib/api/error';

vi.mock('../hooks/useWorkspacesQuery');
vi.mock('../../../context/FrontendConfigContext.tsx', () => ({
  useFrontendConfig: () => ({ backendUrl: 'http://localhost' }),
  FrontendConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../../components/ControlPlanes/List/ControlPlaneListAllWorkspaces.tsx', () => ({
  default: () => null,
}));
vi.mock('../../../components/Core/BreadcrumbFeedbackHeader.tsx', () => ({
  BreadcrumbFeedbackHeader: () => null,
}));
vi.mock('../../../components/ControlPlanes/List/ControlPlaneListToolbar.tsx', () => ({
  ControlPlaneListToolbar: () => null,
}));
vi.mock('../../../components/Projects/ProjectChooser.tsx', () => ({
  default: () => null,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));
vi.mock('@ui5/webcomponents-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ui5/webcomponents-react')>()),
  ObjectPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ObjectPageTitle: () => null,
}));
vi.mock('../../../components/Ui/Center/Center.tsx', () => ({
  Center: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx', () => ({
  NotFoundBanner: () => <div data-testid="not-found-banner" />,
}));
vi.mock('../../../components/Shared/Loading.tsx', () => ({
  default: () => <div data-testid="loading" />,
}));

const mockUseWorkspacesQuery = vi.mocked(useWorkspacesQuery);

const NOT_FOUND_ERROR = new APIError('not found', 404);

const renderPage = (projectName = 'deleted-project') =>
  render(
    <MemoryRouter initialEntries={[`/mcp/projects/${projectName}`]}>
      <Routes>
        <Route path="/mcp/projects/:projectName" element={<ProjectPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('ProjectPage', () => {
  beforeEach(() => {
    clearRememberedProject();
  });

  afterEach(() => {
    cleanup();
    clearRememberedProject();
  });

  it('clears the remembered project when the project returns 404', () => {
    setRememberedProject('deleted-project');
    mockUseWorkspacesQuery.mockReturnValue({
      data: undefined,
      error: NOT_FOUND_ERROR,
      isPending: false,
    } as unknown as ReturnType<typeof useWorkspacesQuery>);

    renderPage('deleted-project');

    expect(getRememberedProject()).toBeNull();
  });

  it('does not clear the remembered project when a different project returns 404', () => {
    setRememberedProject('other-project');
    mockUseWorkspacesQuery.mockReturnValue({
      data: undefined,
      error: NOT_FOUND_ERROR,
      isPending: false,
    } as unknown as ReturnType<typeof useWorkspacesQuery>);

    renderPage('deleted-project');

    expect(getRememberedProject()).toBe('other-project');
  });

  it('does not clear the remembered project when query succeeds', () => {
    setRememberedProject('my-project');
    mockUseWorkspacesQuery.mockReturnValue({
      data: [],
      error: null,
      isPending: false,
    } as unknown as ReturnType<typeof useWorkspacesQuery>);

    renderPage('my-project');

    expect(getRememberedProject()).toBe('my-project');
  });
});
