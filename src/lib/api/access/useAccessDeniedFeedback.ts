import { useCallback, useContext } from 'react';
import { ApiConfigContext } from '../../../components/Shared/k8s/index.ts';
import { isForbiddenError } from '../error.ts';
import { canIKey, useMarkAccessDenied, type AccessAttributes } from './useCanI.ts';

export function useAccessDeniedFeedback() {
  const { mcpConfig } = useContext(ApiConfigContext);
  const markDenied = useMarkAccessDenied();
  return useCallback(
    (error: unknown, attrs: AccessAttributes | null, target: 'onboarding' | 'mcp' = 'onboarding') => {
      if (!attrs || !isForbiddenError(error) || (target === 'mcp' && !mcpConfig?.isV2)) return;
      markDenied(canIKey(attrs, target, mcpConfig));
    },
    [markDenied, mcpConfig],
  );
}
