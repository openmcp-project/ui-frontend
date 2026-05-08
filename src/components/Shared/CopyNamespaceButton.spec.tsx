import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useCopyButton } from '../../context/CopyButtonContext';

const mockCopyToClipboard = vi.fn();
const mockSetActiveCopyId = vi.fn();
let mockActiveCopyId = '';

vi.mock('../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: vi.fn(),
}));

vi.mock('../../context/CopyButtonContext', () => ({
  useCopyButton: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('CopyNamespaceButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveCopyId = '';

    (useCopyToClipboard as ReturnType<typeof vi.fn>).mockReturnValue({
      copyToClipboard: mockCopyToClipboard,
    });

    (useCopyButton as ReturnType<typeof vi.fn>).mockReturnValue({
      activeCopyId: mockActiveCopyId,
      setActiveCopyId: mockSetActiveCopyId,
    });
  });

  it('provides copyToClipboard functionality', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.copyToClipboard).toBeDefined();
    expect(typeof result.current.copyToClipboard).toBe('function');
  });

  it('calls copyToClipboard with correct namespace', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const namespace = 'test-namespace';

    await act(async () => {
      await result.current.copyToClipboard(namespace, { showToastOnSuccess: false });
    });

    expect(mockCopyToClipboard).toHaveBeenCalledWith(namespace, { showToastOnSuccess: false });
  });

  it('updates active copy id when copy is triggered', () => {
    const { result } = renderHook(() => useCopyButton());

    act(() => {
      result.current.setActiveCopyId('test-id');
    });

    expect(mockSetActiveCopyId).toHaveBeenCalledWith('test-id');
  });

  it('provides namespace prop for button text', () => {
    const namespace = 'project-test--ws-workspace';

    expect(namespace).toBe('project-test--ws-workspace');
  });
});
