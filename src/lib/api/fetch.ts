import { APIError } from './error';
import { ApiConfig } from './types/apiConfig';
import { AUTH_FLOW_SESSION_KEY } from '../../common/auth/AuthCallbackHandler.tsx';
import { getRedirectSuffix } from '../../common/auth/getRedirectSuffix.ts';

const useCrateClusterHeader = 'X-use-crate';
const projectNameHeader = 'X-project';
const workspaceNameHeader = 'X-workspace';
const mcpNameHeader = 'X-mcp';
const jqHeader = 'X-jq';
const contentTypeHeader = 'Content-Type';

// fetchApiServer is a wrapper around fetch that adds the necessary headers for the Crate API or the MCP API server.
export const parseJsonOrText = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const fetchApiServer = async (
  path: string,
  config: ApiConfig,
  jq?: string,
  httpMethod: string = 'GET',
  body?: BodyInit,
): Promise<Response> => {
  // The default headers used for the fetch request.
  // The Authorization header is required for both the Crate API and the MCP API and the correct token is passed in the config object that is consumed outside this function from the context that has handled the OIDC flow to get a token.
  const headers: { [key: string]: string } = {};
  if (httpMethod !== 'PATCH') {
    headers[contentTypeHeader] = 'application/json';
  } else {
    headers[contentTypeHeader] = 'application/merge-patch+json';
  }

  // Set the jq header to do a jq transformation on the proxy server.
  if (jq) headers[jqHeader] = jq;

  // If the config object has a mcpConfig, it is assumed that the request is for the MCP API server and the necessary headers are set for the backend to get the OIDC kubeconfig without exposing it to the frontend,
  // otherwise, the useCrateClusterHeader is set to true to indicate that the request is for the Crate
  if (config.mcpConfig !== undefined) {
    headers[projectNameHeader] = config.mcpConfig.projectName;
    headers[workspaceNameHeader] = config.mcpConfig.workspaceName;
    headers[mcpNameHeader] = config.mcpConfig.controlPlaneName;
  } else {
    headers[useCrateClusterHeader] = 'true';
  }

  const res = await fetch(`/api/onboarding${path}`, {
    headers,
    method: httpMethod,
    body,
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Unauthorized (token expired), redirect to the login page
      sessionStorage.setItem(AUTH_FLOW_SESSION_KEY, 'onboarding');
      window.location.replace(`/api/auth/onboarding/login?redirectTo=${encodeURIComponent(getRedirectSuffix())}`);
    }
    const error = new APIError('An error occurred while fetching the data.', res.status);
    error.info = await parseJsonOrText(res);
    throw error;
  }

  return res;
};

export const fetchApiServerJson = async <T>(
  path: string,
  config: ApiConfig,
  jq?: string,
  httpMethod: string = 'GET',
  body?: BodyInit,
): Promise<T | string> => {
  const res = await fetchApiServer(path, config, jq, httpMethod, body);
  const data = await parseJsonOrText(res);
  if (typeof data === 'string') {
    return data as string;
  }
  return data as T;
};

// request is of [path, config, jq]
export const fetchApiServerJsonMultiple = (requests: [string | null, ApiConfig, string | undefined][]) => {
  return Promise.all(
    requests
      .filter((r) => r[0] !== null)
      .map(([path, config, jq]) =>
        // @ts-expect-error path is not null
        fetchApiServer(path, config, jq).then((res) => parseJsonOrText(res)),
      ),
  );
};
