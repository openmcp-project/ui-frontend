import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResourceUploadDialog } from './ResourceUploadDialog';

const mockGetPluralKind = vi.fn((kind: string) => kind.toLowerCase() + 's');

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'resourceUpload.title': 'Add Resource',
        'resourceUpload.targetNamespace': 'Target Namespace',
        'resourceUpload.editorHint': 'Type or paste YAML, or drag and drop a file',
        'resourceUpload.browseFiles': 'Browse',
        'resourceUpload.dropToLoad': 'Drop file to load into editor',
        'resourceUpload.createFromCRD': 'Create from CRD',
        'resourceUpload.crdComingSoon': 'Coming soon',
        'resourceUpload.crdHint': 'Available in next release',
        'resourceUpload.emptyContent': 'Please provide YAML content',
        'resourceUpload.success': 'Resource created successfully',
        'resourceUpload.failed': 'Failed to create resource',
        'resourceUpload.fileReadError': 'Failed to read file',
        'resourceUpload.invalidFileType': 'Please upload a YAML or text file',
        'resourceUpload.validation.invalidYaml': 'Invalid YAML syntax',
        'resourceUpload.validation.missingRequired': 'Resource must include kind, apiVersion, and metadata.name',
        'resourceUpload.validation.resourceExists': `Warning: A ${params?.kind} named '${params?.name}' already exists`,
        'buttons.cancel': 'Cancel',
        'buttons.create': 'Create',
        'buttons.submitting': 'Submitting...',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('../YamlEditor/YamlEditor', () => ({
  YamlEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (val: string) => void;
  }) => (
    <textarea
      data-testid="yaml-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('../Shared/k8s', () => ({
  ApiConfigContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

vi.mock('../../hooks/useResourcePluralNames', () => ({
  useResourcePluralNames: () => ({
    getPluralKind: mockGetPluralKind,
  }),
}));

vi.mock('../../lib/api/fetch', () => ({
  fetchApiServerJson: vi.fn(() => Promise.reject(new Error('Not found'))),
}));

describe('ResourceUploadDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dialog when open', () => {
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Add Resource')).toBeDefined();
    expect(screen.getByTestId('yaml-editor')).toBeDefined();
  });

  it('should display namespace info when namespace is provided', () => {
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        namespace="test-namespace"
      />
    );

    expect(screen.getByText('Target Namespace')).toBeDefined();
    expect(screen.getByText('test-namespace')).toBeDefined();
  });

  it('should show editor hint', () => {
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Type or paste YAML, or drag and drop a file')).toBeDefined();
  });

  it('should allow typing in the editor', () => {
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const editor = screen.getByTestId('yaml-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'test: yaml' } });

    expect(editor.value).toBe('test: yaml');
  });

  it('should handle file upload via input', async () => {
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const fileInput = screen.getByLabelText(/browse/i).querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['apiVersion: v1\nkind: ConfigMap'], 'test.yaml', { type: 'text/yaml' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const editor = screen.getByTestId('yaml-editor') as HTMLTextAreaElement;
      expect(editor.value).toContain('apiVersion: v1');
    });
  });

  it('should disable create button when content is empty', () => {
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const createButton = screen.getByText('Create');
    expect(createButton).toHaveProperty('disabled', true);
  });

  it('should enable create button when content is provided', () => {
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const editor = screen.getByTestId('yaml-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'apiVersion: v1\nkind: ConfigMap' } });

    const createButton = screen.getByText('Create');
    expect(createButton).toHaveProperty('disabled', false);
  });

  it('should call onSubmit when create button is clicked', async () => {
    mockOnSubmit.mockResolvedValue({ success: true });

    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const editor = screen.getByTestId('yaml-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'test: yaml' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test: yaml');
    });
  });

  it('should show success message after successful submission', async () => {
    mockOnSubmit.mockResolvedValue({ success: true });

    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const editor = screen.getByTestId('yaml-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'test: yaml' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Resource created successfully')).toBeDefined();
    });
  });

  it('should show error message on failed submission', async () => {
    mockOnSubmit.mockResolvedValue({ success: false, error: 'Failed to create' });

    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const editor = screen.getByTestId('yaml-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'test: yaml' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create')).toBeDefined();
    });
  });

  it('should show CRD button as disabled', () => {
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const crdButton = screen.getByText('Create from CRD');
    expect(crdButton).toHaveProperty('disabled', true);
  });
});
