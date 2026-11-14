import { useContext } from 'react';
import useSWR from 'swr';
import { CRDRequestAuthCheck } from '../../../lib/api/types/crossplane/CRDList.ts';
import { useApiResource } from '../../../lib/api/useApiResource.ts';
import { fetchApiServerJson } from '../../../lib/api/fetch.ts';
import { ApiConfigContext } from '../../../components/Shared/k8s/index.ts';
import { APIError } from '../../../lib/api/error.ts';

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

interface RulesReviewResponse {
  status?: {
    incomplete?: boolean;
    resourceRules?: unknown[];
  };
}

const RULES_REVIEW_PATH = '/apis/authorization.k8s.io/v1/selfsubjectrulesreviews';

/**
 * V2 gate. Does not probe a single resource. Returns `isUnauthorized: true`
 * only on a confirmed deny:
 *   - the SelfSubjectRulesReview request returns 403, or
 *   - the review comes back complete (`incomplete !== true`) with no resource rules.
 * A 401 is not a deny (fetchApiServer refreshes/redirects); a network error,
 * an incomplete review, or any rules present all pass. No blocking spinner.
 */
export function useMcpAuthorizationCheckV2(): McpAuthorizationCheck {
  const apiConfig = useContext(ApiConfigContext);

  const { data, error, isLoading } = useSWR<RulesReviewResponse>(
    ['mcp-rules-review', apiConfig.mcpConfig ?? null],
    () =>
      fetchApiServerJson<RulesReviewResponse>(
        RULES_REVIEW_PATH,
        apiConfig,
        undefined,
        'POST',
        JSON.stringify({
          apiVersion: 'authorization.k8s.io/v1',
          kind: 'SelfSubjectRulesReview',
          spec: { namespace: 'default' },
        }),
      ),
    {
      errorRetryCount: 1,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  );

  const apiError = error as APIError | undefined;
  const requestForbidden = apiError?.status === 403;
  const status = data?.status;
  const emptyRulesWhenComplete = !!data && status?.incomplete !== true && (status?.resourceRules?.length ?? 0) === 0;

  return {
    isLoading,
    isUnauthorized: requestForbidden || emptyRulesWhenComplete,
  };
}
