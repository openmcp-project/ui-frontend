import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ProjectsListView from './ProjectList';
import { setRememberedProject, clearRememberedProject, getRememberedProject } from '../utils/rememberedProject';

const mockNavigate = vi.fn();
const mockSetSearchParams = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('@ui5/webcomponents-react', () => ({
  ObjectPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ObjectPageTitle: ({ header }: { header: React.ReactNode }) => <div>{header}</div>,
  CheckBox: ({
    checked,
    onChange,
  }: {
    text: string;
    checked?: boolean;
    onChange?: (e: { target: { checked: boolean } }) => void;
  }) => (
    <input
      type="checkbox"
      data-testid="remember-checkbox"
      defaultChecked={!!checked}
      onChange={(e) => onChange?.({ target: { checked: e.target.checked } })}
    />
  ),
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

      expect(mockNavigate).toHaveBeenCalledWith('/mcp/projects/my-project', { replace: true });
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

  describe('remember selection checkbox', () => {
    it('renders unchecked when no project is remembered', () => {
      renderView();
      // eslint-disable-next-line jest-dom/prefer-checked
      expect((screen.getByTestId('remember-checkbox') as HTMLInputElement).checked).toBe(false);
    });

    it('renders checked when a project is already remembered', () => {
      setRememberedProject('existing-project');
      renderView();
      // eslint-disable-next-line jest-dom/prefer-checked
      expect((screen.getByTestId('remember-checkbox') as HTMLInputElement).checked).toBe(true);
    });

    it('clears localStorage when checkbox is unchecked', () => {
      setRememberedProject('some-project');
      renderView();

      // starts checked (defaultChecked=true); clicking toggles to unchecked
      fireEvent.click(screen.getByTestId('remember-checkbox'));

      expect(getRememberedProject()).toBeNull();
    });
  });
});
