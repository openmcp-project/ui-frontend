/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not installed in this project */
import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { YamlSidePanelWithGraphqlLoader } from './YamlSidePanelWithGraphqlLoader';
import { useCrossplaneYamlQuery } from '../../spaces/mcp/hooks/useCrossplaneYamlQuery.ts';
import { useFluxYamlQuery } from '../../spaces/mcp/hooks/useFluxYamlQuery.ts';
import { useLandscaperYamlQuery } from '../../spaces/mcp/hooks/useLandscaperYamlQuery.ts';
import { useEsoYamlQuery } from '../../spaces/mcp/hooks/useEsoYamlQuery.ts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../spaces/mcp/hooks/useCrossplaneYamlQuery.ts');
vi.mock('../../spaces/mcp/hooks/useFluxYamlQuery.ts');
vi.mock('../../spaces/mcp/hooks/useLandscaperYamlQuery.ts');
vi.mock('../../spaces/mcp/hooks/useEsoYamlQuery.ts');
vi.mock('../Shared/Loading.tsx', () => ({
  default: () => <div data-testid="loading" />,
}));
vi.mock('../Shared/IllustratedError.tsx', () => ({
  default: ({ details }: { details?: string }) => <div data-testid="error">{details}</div>,
}));
vi.mock('./YamlSidePanel.tsx', () => ({
  YamlSidePanel: ({ resource, filename }: { resource: { kind: string }; filename: string }) => (
    <div data-testid="panel">
      {resource.kind}:{filename}
    </div>
  ),
}));

const idle = { yaml: null, isLoading: false, error: undefined };

const useCrossplaneYamlQueryMock = vi.mocked(useCrossplaneYamlQuery);
const useFluxYamlQueryMock = vi.mocked(useFluxYamlQuery);
const useLandscaperYamlQueryMock = vi.mocked(useLandscaperYamlQuery);
const useEsoYamlQueryMock = vi.mocked(useEsoYamlQuery);

describe('YamlSidePanelWithGraphqlLoader', () => {
  beforeEach(() => {
    useCrossplaneYamlQueryMock.mockReturnValue(idle);
    useFluxYamlQueryMock.mockReturnValue(idle);
    useLandscaperYamlQueryMock.mockReturnValue(idle);
    useEsoYamlQueryMock.mockReturnValue(idle);
  });

  afterEach(() => {
    cleanup();
  });

  it('skips the three non-matching hooks for the selected component', () => {
    render(<YamlSidePanelWithGraphqlLoader component="crossplane" mcpName="my-mcp" mcpNamespace="my-ns" />);

    expect(useCrossplaneYamlQueryMock).toHaveBeenCalledWith('my-mcp', 'my-ns', false);
    expect(useFluxYamlQueryMock).toHaveBeenCalledWith('my-mcp', 'my-ns', true);
    expect(useLandscaperYamlQueryMock).toHaveBeenCalledWith('my-mcp', 'my-ns', true);
    expect(useEsoYamlQueryMock).toHaveBeenCalledWith('my-mcp', 'my-ns', true);
  });

  it('renders a loading state while the query is in flight', () => {
    useCrossplaneYamlQueryMock.mockReturnValue({ yaml: null, isLoading: true, error: undefined });

    render(<YamlSidePanelWithGraphqlLoader component="crossplane" mcpName="my-mcp" mcpNamespace="my-ns" />);

    expect(screen.getByTestId('loading')).not.toBeNull();
  });

  it('renders an error state when the query fails', () => {
    useFluxYamlQueryMock.mockReturnValue({ yaml: null, isLoading: false, error: new Error('boom') });

    render(<YamlSidePanelWithGraphqlLoader component="flux" mcpName="my-mcp" mcpNamespace="my-ns" />);

    expect(screen.getByTestId('error')).not.toBeNull();
  });

  it('renders an error state when the yaml cannot be parsed', () => {
    useLandscaperYamlQueryMock.mockReturnValue({ yaml: '{{{not valid yaml::', isLoading: false, error: undefined });

    render(<YamlSidePanelWithGraphqlLoader component="landscaper" mcpName="my-mcp" mcpNamespace="my-ns" />);

    expect(screen.getByTestId('error')).not.toBeNull();
  });

  it('parses the yaml and renders the panel on success', () => {
    useEsoYamlQueryMock.mockReturnValue({
      yaml: 'apiVersion: v1\nkind: ExternalSecretsOperator\nmetadata:\n  name: my-mcp\n',
      isLoading: false,
      error: undefined,
    });

    render(<YamlSidePanelWithGraphqlLoader component="eso" mcpName="my-mcp" mcpNamespace="my-ns" />);

    expect(screen.getByTestId('panel').textContent).toBe('ExternalSecretsOperator:ExternalSecretsOperator_my-mcp');
  });
});
