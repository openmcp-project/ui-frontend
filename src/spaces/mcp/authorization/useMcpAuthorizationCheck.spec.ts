import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { useMcpAuthorizationCheck } from './useMcpAuthorizationCheck.ts';
import * as useApiResourceModule from '../../../lib/api/useApiResource.ts';
import { CRDRequestAuthCheck } from '../../../lib/api/types/crossplane/CRDList.ts';
import type { APIError } from '../../../lib/api/error.ts';

describe('useMcpAuthorizationCheck', () => {
  let useApiResourceMock: Mock;

  const setupApiResourceMock = (overrides: { isLoading?: boolean; error?: Partial<APIError> } = {}) => {
    useApiResourceMock.mockReturnValue({
      data: undefined,
      isLoading: overrides.isLoading ?? false,
      isValidating: false,
      error: overrides.error,
    });
  };

  beforeEach(() => {
    useApiResourceMock = vi.fn();
    vi.spyOn(useApiResourceModule, 'useApiResource').mockImplementation(useApiResourceMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('disables SWR error retries to keep isLoading stable across errors', () => {
    setupApiResourceMock();

    renderHook(() => useMcpAuthorizationCheck());

    expect(useApiResourceMock).toHaveBeenCalledWith(CRDRequestAuthCheck, { errorRetryCount: 0 });
  });

  it('returns isLoading=true while the request is pending', () => {
    setupApiResourceMock({ isLoading: true });

    const { result } = renderHook(() => useMcpAuthorizationCheck());

    expect(result.current).toEqual({ isLoading: true, isUnauthorized: false });
  });

  it('returns isUnauthorized=false on success', () => {
    setupApiResourceMock();

    const { result } = renderHook(() => useMcpAuthorizationCheck());

    expect(result.current).toEqual({ isLoading: false, isUnauthorized: false });
  });

  it('returns isUnauthorized=true on a 401 error', () => {
    setupApiResourceMock({ error: { status: 401 } as APIError });

    const { result } = renderHook(() => useMcpAuthorizationCheck());

    expect(result.current.isUnauthorized).toBe(true);
  });

  it('returns isUnauthorized=true on a 403 error', () => {
    setupApiResourceMock({ error: { status: 403 } as APIError });

    const { result } = renderHook(() => useMcpAuthorizationCheck());

    expect(result.current.isUnauthorized).toBe(true);
  });

  it('returns isUnauthorized=false on non-auth errors (e.g. 500 when Crossplane is not installed)', () => {
    setupApiResourceMock({ error: { status: 500 } as APIError });

    const { result } = renderHook(() => useMcpAuthorizationCheck());

    expect(result.current.isUnauthorized).toBe(false);
  });

  it('returns isUnauthorized=false on errors without a status', () => {
    setupApiResourceMock({ error: {} as APIError });

    const { result } = renderHook(() => useMcpAuthorizationCheck());

    expect(result.current.isUnauthorized).toBe(false);
  });
});
