import { AuthFlow, STORAGE_KEY_AUTH_FLOW } from './AuthCallbackHandler';
import { getRedirectSuffix } from './getRedirectSuffix';

export function redirectToLogin(flow: AuthFlow): void {
  sessionStorage.setItem(STORAGE_KEY_AUTH_FLOW, flow);
  window.location.replace(`/api/auth/${flow}/login?redirectTo=${encodeURIComponent(getRedirectSuffix())}`);
}
