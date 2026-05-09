import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResourceUploadDialog } from './ResourceUploadDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'resourceUpload.title': 'Add Resource',
        'resourceUpload.targetNamespace': 'Target Namespace',
        'resourceUpload.yamlEditor': 'YAML Editor',
        'resourceUpload.uploadFile': 'Upload File',
        'resourceUpload.dragDropText': 'Drag and drop your YAML file here',
        'resourceUpload.or': 'or',
        'resourceUpload.browseFiles': 'Browse Files',
        'resourceUpload.createFromCRD': 'Create from CRD',
        'resourceUpload.crdComingSoon': 'Coming soon',
        'resourceUpload.crdHint': 'Available in next release',
        'resourceUpload.emptyContent': 'Please provide YAML content',
        'resourceUpload.success': 'Resource created successfully',
        'resourceUpload.failed': 'Failed to create resource',
        'resourceUpload.fileReadError': 'Failed to read file',
        'resourceUpload.invalidFileType': 'Please upload a YAML or text file',
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

describe('ResourceUploadDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    // ARRANGE
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the dialog when open', () => {
    // ACT
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // ASSERT
    expect(screen.getByText('Add Resource')).toBeInTheDocument();
  });

  it('should display namespace info when namespace is provided', () => {
    // ACT
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        namespace="test-namespace"
      />
    );

    // ASSERT
    expect(screen.getByText('Target Namespace')).toBeInTheDocument();
    expect(screen.getByText('test-namespace')).toBeInTheDocument();
  });

  it('should switch between editor and upload modes', () => {
    // ARRANGE
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // ACT
    const uploadButton = screen.getByText('Upload File');
    fireEvent.click(uploadButton);

    // ASSERT
    expect(screen.getByText('Drag and drop your YAML file here')).toBeInTheDocument();
  });

  it('should allow YAML content to be edited', () => {
    // ARRANGE
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // ACT
    const editor = screen.getByTestId('yaml-editor');
    fireEvent.change(editor, { target: { value: 'apiVersion: v1\nkind: Pod' } });

    // ASSERT
    expect(editor).toHaveValue('apiVersion: v1\nkind: Pod');
  });

  it('should show error when submitting empty content', async () => {
    // ARRANGE
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // ACT
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText('Please provide YAML content')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit YAML content successfully', async () => {
    // ARRANGE
    mockOnSubmit.mockResolvedValue({
      success: true,
      message: 'Resource created successfully',
    });

    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // ACT
    const editor = screen.getByTestId('yaml-editor');
    fireEvent.change(editor, { target: { value: 'apiVersion: v1\nkind: Pod' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    // ASSERT
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('apiVersion: v1\nkind: Pod');
    });

    await waitFor(() => {
      expect(screen.getByText('Resource created successfully')).toBeInTheDocument();
    });
  });

  it('should display error message on submission failure', async () => {
    // ARRANGE
    mockOnSubmit.mockResolvedValue({
      success: false,
      error: 'Invalid YAML format',
    });

    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // ACT
    const editor = screen.getByTestId('yaml-editor');
    fireEvent.change(editor, { target: { value: 'invalid: yaml: content' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText('Invalid YAML format')).toBeInTheDocument();
    });
  });

  it('should handle file upload via input', async () => {
    // ARRANGE
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Switch to upload mode
    const uploadButton = screen.getByText('Upload File');
    fireEvent.click(uploadButton);

    const file = new File(['apiVersion: v1\nkind: ConfigMap'], 'test.yaml', {
      type: 'text/yaml',
    });

    const input = screen.getByLabelText('Browse Files').querySelector('input') as HTMLInputElement;

    // ACT
    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });
    fireEvent.change(input);

    // ASSERT
    await waitFor(() => {
      const editor = screen.getByTestId('yaml-editor');
      expect(editor).toHaveValue('apiVersion: v1\nkind: ConfigMap');
    });
  });

  it('should handle drag and drop file upload', async () => {
    // ARRANGE
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Switch to upload mode
    const uploadButton = screen.getByText('Upload File');
    fireEvent.click(uploadButton);

    const uploadZone = screen.getByText('Drag and drop your YAML file here').parentElement;
    const file = new File(['apiVersion: v1\nkind: Service'], 'test.yaml', {
      type: 'text/yaml',
    });

    // ACT
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [file],
      },
    };
    fireEvent.drop(uploadZone!, dropEvent as any);

    // ASSERT
    await waitFor(() => {
      const editor = screen.getByTestId('yaml-editor');
      expect(editor).toHaveValue('apiVersion: v1\nkind: Service');
    });
  });

  it('should reject non-YAML files with error message', async () => {
    // ARRANGE
    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Switch to upload mode
    const uploadButton = screen.getByText('Upload File');
    fireEvent.click(uploadButton);

    const uploadZone = screen.getByText('Drag and drop your YAML file here').parentElement;
    const file = new File(['some content'], 'test.pdf', { type: 'application/pdf' });

    // ACT
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [file],
      },
    };
    fireEvent.drop(uploadZone!, dropEvent as any);

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText('Please upload a YAML or text file')).toBeInTheDocument();
    });
  });

  it('should disable create button when submitting', async () => {
    // ARRANGE
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // ACT
    const editor = screen.getByTestId('yaml-editor');
    fireEvent.change(editor, { target: { value: 'apiVersion: v1\nkind: Pod' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });
  });

  it('should close dialog after successful submission', async () => {
    // ARRANGE
    mockOnSubmit.mockResolvedValue({
      success: true,
      message: 'Resource created successfully',
    });

    render(
      <ResourceUploadDialog
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // ACT
    const editor = screen.getByTestId('yaml-editor');
    fireEvent.change(editor, { target: { value: 'apiVersion: v1\nkind: Pod' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    // ASSERT
    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });
});
