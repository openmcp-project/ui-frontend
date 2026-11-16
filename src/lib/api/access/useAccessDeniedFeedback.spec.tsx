import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { ApiConfigContext } from '../../../components/Shared/k8s/index.ts';
import { APIError } from '../error.ts';
import { useCanI, type AccessAttributes } from './useCanI.ts';
import { useAccessDeniedFeedback } from './useAccessDeniedFeedback.ts';

const attrs: AccessAttributes = {
  verb: 'delete',
  group: 'example.io',
  resource: 'things',
  namespace: 'team',
  name: 'one',
};

function wrapper(isV2 = true) {
  const cache = new Map();
  return ({ children }: { children: ReactNode }) => (
    <SWRConfig value={{ provider: () => cache }}>
      <ApiConfigContext.Provider
        value={{ mcpConfig: { projectName: 'p', workspaceName: 'w', controlPlaneName: 'cp', idp: 'custom', isV2 } }}
      >
        {children}
      </ApiConfigContext.Provider>
    </SWRConfig>
  );
}

describe('action denial feedback', () => {
  it('records a real 403 only for the matching target, resource, and verb', async () => {
    const { result } = renderHook(
      () => ({
        record: useAccessDeniedFeedback(),
        denied: useCanI(attrs, { target: 'mcp', enabled: false }),
        other: useCanI({ ...attrs, name: 'two' }, { target: 'mcp', enabled: false }),
        patch: useCanI({ ...attrs, verb: 'patch' }, { target: 'mcp', enabled: false }),
        onboarding: useCanI(attrs, { enabled: false }),
      }),
      { wrapper: wrapper() },
    );
    await act(async () => result.current.record(new APIError('Forbidden', 403), attrs, 'mcp'));
    expect(result.current.denied.state).toBe('denied');
    expect(result.current.other.state).toBe('unknown');
    expect(result.current.patch.state).toBe('unknown');
    expect(result.current.onboarding.state).toBe('unknown');
  });

  it.each([new APIError('Unauthorized', 401), new APIError('Unavailable', 503), new TypeError('Network error')])(
    'does not cache non-forbidden errors: %s',
    async (error) => {
      const { result } = renderHook(
        () => ({ record: useAccessDeniedFeedback(), access: useCanI(attrs, { enabled: false }) }),
        { wrapper: wrapper() },
      );
      await act(async () => result.current.record(error, attrs));
      expect(result.current.access.state).toBe('unknown');
    },
  );

  it('does not apply downstream feedback to v1', async () => {
    const { result } = renderHook(
      () => ({ record: useAccessDeniedFeedback(), access: useCanI(attrs, { target: 'mcp', enabled: false }) }),
      { wrapper: wrapper(false) },
    );
    await act(async () => result.current.record(new APIError('Forbidden', 403), attrs, 'mcp'));
    expect(result.current.access.state).toBe('unknown');
  });
});
