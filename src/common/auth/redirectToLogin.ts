import { AuthFlow, STORAGE_KEY_AUTH_FLOW } from './AuthCallbackHandler';
import { getRedirectSuffix } from './getRedirectSuffix';
import { clearPersistedSwrCache } from '../../lib/swr/persistentProvider';

export function redirectToLogin(flow: AuthFlow): void {
  sessionStorage.setItem(STORAGE_KEY_AUTH_FLOW, flow);
  clearPersistedSwrCache();
  window.location.replace(`/api/auth/${flow}/login?redirectTo=${encodeURIComponent(getRedirectSuffix())}`);
}
