import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ProjectsListView from './ProjectList';
import { setRememberedProject, clearRememberedProject } from '../utils/rememberedProject';

const mockNavigate = vi.fn();
const mockSetSearchParams = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('@ui5/webcomponents-react', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  ObjectPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ObjectPageTitle: ({ header }: { header: React.ReactNode }) => <div>{header}</div>,
  ObjectPageSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [currentSearchParams, mockSetSearchParams],
}));

vi.mock('../components/Projects/ProjectsList.tsx', () => ({
  default: () => <div data-testid="projects-list" />,
}));

vi.mock('../components/Core/BreadcrumbFeedbackHeader.tsx', () => ({
  BreadcrumbFeedbackHeader: () => null,
}));

vi.mock('../components/Projects/ProjectListToolbar.tsx', () => ({
  ProjectListToolbar: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const renderView = (searchParamsString = '') => {
  currentSearchParams = new URLSearchParams(searchParamsString);
  return render(
    <MemoryRouter>
      <ProjectsListView />
    </MemoryRouter>,
  );
};

describe('ProjectsListView', () => {
  beforeEach(() => {
    clearRememberedProject();
    mockNavigate.mockReset();
    mockSetSearchParams.mockReset();
    currentSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
    clearRememberedProject();
  });

  describe('auto-redirect', () => {
    it('redirects to the remembered project on mount', () => {
      setRememberedProject('my-project');
      renderView();

      expect(mockNavigate).toHaveBeenCalledWith('/projects/my-project', { replace: true });
    });

    it('does not redirect when no project is remembered', () => {
      renderView();

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not redirect when noRedirect param is present even if a project is remembered', () => {
      setRememberedProject('my-project');
      renderView('noRedirect=true');

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('strips noRedirect param from the URL after reading it', () => {
      renderView('noRedirect=true');

      expect(mockSetSearchParams).toHaveBeenCalledWith({}, { replace: true });
    });

    it('does not call setSearchParams when noRedirect param is absent', () => {
      renderView();

      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });
  });
});
