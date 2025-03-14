import { AuthProviderProps } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import yaml from "js-yaml";

// Extract the oidc configuration from the kubeconfig for the current context
export function GetAuthPropsForCurrentContext(data: string): AuthProviderProps {
  const kubeconfig = yaml.load(data as string) as any

  const currentContext = kubeconfig["current-context"]
  if (!currentContext) {
    throw new Error("oidc extraction: current context not found")
  }
  const context = LookupContextByName(currentContext, kubeconfig);
  return GetAuthPropsForContext(context, kubeconfig)
}

// Extract the oidc configuration from the kubeconfig for the given context name
export function GetAuthPropsForContextName(contextName: string, data: string): AuthProviderProps {
  const kubeconfig = yaml.load(data as string) as any
  const context = LookupContextByName(contextName, kubeconfig);
  return GetAuthPropsForContext(context, kubeconfig)
}

// Extract the oidc configuration from the kubeconfig for the given context from the users section
export function GetAuthPropsForContext(context: Context, kubeconfig: any): AuthProviderProps {
  if (!kubeconfig.users) {
    throw new Error("oidc extraction: no users in kubeconfig")
  }
  let user = lookupUserByName(context.context.user, kubeconfig)
  if (!user) {
    throw new Error("oidc extraction: user name of context not found")
  }
  if (!user.user) {
    throw new Error("oidc extraction: user object not found")
  }
  user = user.user
  if (!user.exec && user.exec.command !== "kubectl") {
    throw new Error("oidc extraction: only kubectl is supported for now")
  }
  let args = user.exec.args
  if (!args) {
    throw new Error("oidc extraction: not enough arguments in kubeconfig")
  }
  if (args[0] !== "oidc-login") {
    throw new Error("oidc extraction: kubectl exec command is not oidc-login")
  }
  let isPKCE = args.includes("--oidc-use-pkce")
  if (!isPKCE) {
    throw new Error("oidc extraction: only PKCE is supported for now")
  }
  let authority = findArgument(args, "--oidc-issuer-url")
  let clientId = findArgument(args, "--oidc-client-id")
  let scopes = findArguments(args, "--oidc-extra-scope")
  let redirectUri = getDefaultRedirectUri()
  let userStore = new WebStorageStateStore({ store: window.localStorage })
  if (!authority) {
    throw new Error("oidc extraction: issuer url not found")
  }
  if (!clientId) {
    throw new Error("oidc extraction: client id not found")
  }
  const props: AuthProviderProps = {
    authority: authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    userStore: userStore,
    automaticSilentRenew: false, // we show a window instead that asks the user to renew the token
    onSigninCallback: () => {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      )
    },
  }
  return props
}

function LookupContextByName(contextName: string, kubeconfig: any) {
  let contexts = kubeconfig.contexts as Context[]
  for (let i = 0; i < contexts.length; i++) {
    if (contexts[i].name === contextName) {
      return contexts[i]
    }
  }
  throw new Error("oidc extraction: context not found")
}

// Find the argument that starts with key and return its value
function findArgument(args: string[], key: string): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(key)) {
      return args[i].split("=")[1]
    }
  }
  return undefined
}

// Find all arguments that start with key and return their values
function findArguments(args: string[], key: string): string[] {
  let values: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(key)) {
      values.push(args[i].split("=")[1])
    }
  }
  return values
}
function lookupUserByName(username: string, kubeconfig: any) {
  let users = kubeconfig.users
  for (let i = 0; i < users.length; i++) {
    if (users[i].name === username) {
      return users[i]
    }
  }
  return undefined
}
function getDefaultRedirectUri() {
  return window.location.origin;
}

type Context = {
  name: string,
  context: {
    user: string,
    namespace: string,
    cluster: string,
    extensions: any
  }
}