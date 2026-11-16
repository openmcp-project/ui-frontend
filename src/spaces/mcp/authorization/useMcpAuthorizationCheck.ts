import { useContext } from 'react';
import useSWR from 'swr';
import { CRDRequestAuthCheck } from '../../../lib/api/types/crossplane/CRDList.ts';
import { useApiResource } from '../../../lib/api/useApiResource.ts';
import { fetchApiServerJson } from '../../../lib/api/fetch.ts';
import { ApiConfigContext } from '../../../components/Shared/k8s/index.ts';
import { isForbiddenError, type APIError } from '../../../lib/api/error.ts';
import type { AccessState } from '../../../lib/api/access/useCanI.ts';

export interface McpAuthorizationCheck {
  isLoading: boolean;
  /** Only ever true on a confirmed deny. Loading/error/unknown are all false. */
  isUnauthorized: boolean;
}

/**
 * V1 probe: lists CRDs and treats 401/403 as unauthorized, once. Kept as-is for
 * the legacy MCP page.
 */
export function useMcpAuthorizationCheck(): McpAuthorizationCheck {
  // errorRetryCount: 0 prevents SWR from re-fetching on error (e.g. 500 when Crossplane is not
  // installed), which would cause isLoading to flip back to true and unmount the children.
  const { error, isLoading } = useApiResource(CRDRequestAuthCheck, { errorRetryCount: 0 });
  const isUnauthorized = error?.status === 403 || error?.status === 401;
  return { isLoading, isUnauthorized };
}

interface AccessReviewResponse {
  status?: {
    allowed?: boolean;
    evaluationError?: string;
  };
}

const ACCESS_REVIEW_PATH = '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews';

/**
 * V2 gate: only a forbidden access-review request blocks the whole page.
 * A negative answer for one path (or empty rules in one namespace) cannot
 * establish that the user has no access anywhere in the cluster.
 */
export function useMcpAuthorizationCheckV2(): McpAuthorizationCheck & { state: AccessState } {
  const apiConfig = useContext(ApiConfigContext);

  const { data, error, isLoading } = useSWR<AccessReviewResponse, APIError>(
    apiConfig.mcpConfig ? ['mcp-access-review', apiConfig.mcpConfig] : null,
    () =>
      fetchApiServerJson<AccessReviewResponse>(
        ACCESS_REVIEW_PATH,
        apiConfig,
        undefined,
        'POST',
        JSON.stringify({
          apiVersion: 'authorization.k8s.io/v1',
          kind: 'SelfSubjectAccessReview',
          spec: { nonResourceAttributes: { verb: 'get', path: '/' } },
        }),
      ),
    {
      errorRetryCount: 1,
      dedupingInterval: 60_000,
      revalidateOnFocus: true,
      keepPreviousData: false,
    },
  );

  const status = data?.status;
  const state: AccessState = isForbiddenError(error)
    ? 'denied'
    : !error && typeof status?.allowed === 'boolean' && !status.evaluationError
      ? 'allowed'
      : 'unknown';

  return {
    isLoading,
    isUnauthorized: state === 'denied',
    state,
  };
}
