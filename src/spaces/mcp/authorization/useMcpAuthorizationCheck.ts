import { CRDRequestAuthCheck } from '../../../lib/api/types/crossplane/CRDList.ts';
import { useApiResource } from '../../../lib/api/useApiResource.ts';

export function useMcpAuthorizationCheck() {
  // errorRetryCount: 0 prevents SWR from re-fetching on error (e.g. 500 when Crossplane is not
  // installed), which would cause isLoading to flip back to true and unmount the children.
  const { error, isLoading } = useApiResource(CRDRequestAuthCheck, { errorRetryCount: 0 });
  const isUnauthorized = error?.status === 403 || error?.status === 401;
  return { isLoading, isUnauthorized };
}
