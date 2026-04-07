import { createTokenRefreshCoordinator } from '../../../common/auth/createTokenRefreshCoordinator';

export const { registerRefreshFn, refreshToken, useIsRefreshInProgress } =
  createTokenRefreshCoordinator('token-refresh-mcp');
