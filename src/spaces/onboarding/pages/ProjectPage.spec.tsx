/* eslint-disable jest-dom/prefer-to-have-attribute */
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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
vi.mock('../../../components/Shared/CopyButton.tsx', () => ({
  CopyButton: () => null,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));
vi.mock('@ui5/webcomponents-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ui5/webcomponents-react')>()),
  ObjectPage: ({ children, titleArea }: { children: React.ReactNode; titleArea?: React.ReactNode }) => (
    <div>
      {titleArea}
      {children}
    </div>
  ),
  ObjectPageTitle: ({ actionsBar, subHeader }: { actionsBar?: React.ReactNode; subHeader?: React.ReactNode }) => (
    <div>
      {subHeader}
      {actionsBar}
    </div>
  ),
  FlexBox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ icon, tooltip, onClick }: { icon?: string; tooltip?: string; onClick?: () => void }) => (
    <button
      data-testid={icon?.startsWith('pushpin') ? 'pin-button' : undefined}
      data-icon={icon}
      title={tooltip}
      onClick={onClick}
    />
  ),
}));
vi.mock('../../../components/Ui/Center/Center.tsx', () => ({
  Center: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../../components/Ui/NotFoundBanner/NotFoundBanner.tsx', () => ({
  NotFoundBanner: ({ homePath }: { homePath?: string }) => (
    <div data-testid="not-found-banner" data-home-path={homePath} />
  ),
}));
vi.mock('../../../components/Shared/Loading.tsx', () => ({
  default: () => <div data-testid="loading" />,
}));

const mockUseWorkspacesQuery = vi.mocked(useWorkspacesQuery);

const NOT_FOUND_ERROR = new APIError('not found', 404);

const renderPage = (projectName = 'deleted-project') =>
  render(
    <MemoryRouter initialEntries={[`/projects/${projectName}`]}>
      <Routes>
        <Route path="/projects/:projectName" element={<ProjectPage />} />
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

  it('renders NotFoundBanner with homePath containing noRedirect when project returns 404', () => {
    mockUseWorkspacesQuery.mockReturnValue({
      data: undefined,
      error: NOT_FOUND_ERROR,
      isPending: false,
    } as unknown as ReturnType<typeof useWorkspacesQuery>);

    const { getByTestId } = renderPage('deleted-project');

    const homePath = getByTestId('not-found-banner').getAttribute('data-home-path');
    expect(homePath).toBe('/projects?noRedirect=true');
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

  describe('pin/unpin button', () => {
    beforeEach(() => {
      mockUseWorkspacesQuery.mockReturnValue({
        data: [],
        error: null,
        isPending: false,
      } as unknown as ReturnType<typeof useWorkspacesQuery>);
    });

    it('shows unpin icon when the current project is not remembered', () => {
      renderPage('mcp-ui');
      expect(screen.getByTestId('pin-button').getAttribute('data-icon')).toBe('pushpin-off');
    });

    it('shows pin icon when the current project is remembered', () => {
      setRememberedProject('mcp-ui');
      renderPage('mcp-ui');
      expect(screen.getByTestId('pin-button').getAttribute('data-icon')).toBe('pushpin-on');
    });

    it('shows unpin icon when a different project is remembered', () => {
      setRememberedProject('other-project');
      renderPage('mcp-ui');
      expect(screen.getByTestId('pin-button').getAttribute('data-icon')).toBe('pushpin-off');
    });

    it('saves the project to localStorage when clicking the unpin button', () => {
      renderPage('mcp-ui');

      fireEvent.click(screen.getByTestId('pin-button'));

      expect(getRememberedProject()).toBe('mcp-ui');
    });

    it('clears localStorage when clicking the pin button', () => {
      setRememberedProject('mcp-ui');
      renderPage('mcp-ui');

      fireEvent.click(screen.getByTestId('pin-button'));

      expect(getRememberedProject()).toBeNull();
    });
  });
});
