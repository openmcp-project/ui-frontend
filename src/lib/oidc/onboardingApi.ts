import { WebStorageStateStore } from "oidc-client-ts";
import { AuthProviderProps } from "react-oidc-context";

export interface OIDCConfig {
  clientId: string;
  issuerUrl: string;
  scopes: string[];
}

export function buildAuthProviderProps(oidcConfig: OIDCConfig) {
  const userStore = new WebStorageStateStore({ store: window.localStorage });

  const props: AuthProviderProps = {
    authority: oidcConfig.issuerUrl,
    client_id: oidcConfig.clientId,
    redirect_uri: getDefaultRedirectUri(),
    scope: oidcConfig.scopes.join(' '),
    userStore: userStore,
    automaticSilentRenew: false, // we show a window instead that asks the user to renew the token
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    },
  };
  return props;
}

function getDefaultRedirectUri() {
  return window.location.origin;
}