import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useNavigateToTab } from './useNavigateToTab';

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

describe('useNavigateToTab', () => {
  it('should navigate to specified tab with hash', () => {
    const { result } = renderHook(() => useNavigateToTab());
    const navigateToTab = result.current;

    navigateToTab('flux', 'kustomization-my-kustomization');

    expect(mockNavigate).toHaveBeenCalledWith('?tab=flux#kustomization-my-kustomization');
  });

  it('should navigate to specified tab without hash', () => {
    const { result } = renderHook(() => useNavigateToTab());
    const navigateToTab = result.current;

    navigateToTab('overview');

    expect(mockNavigate).toHaveBeenCalledWith('?tab=overview');
  });

  it('should preserve existing search params', () => {
    mockSearchParams = new URLSearchParams('foo=bar');
    const { result } = renderHook(() => useNavigateToTab());
    const navigateToTab = result.current;

    navigateToTab('flux', 'kustomization-other');

    expect(mockNavigate).toHaveBeenCalledWith('?foo=bar&tab=flux#kustomization-other');
  });
});
