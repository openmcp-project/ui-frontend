import { APIError } from "./error";
import { ApiConfig } from "./types/apiConfig";


const useCrateClusterHeader = "X-use-crate";
const projectNameHeader = "X-project";
const workspaceNameHeader = "X-workspace";
const mcpNameHeader = "X-mcp";
const mcpAuthHeader = "X-mcp-authorization";
const contextHeader = "X-context";
const jqHeader = "X-jq";
const authHeader = "Authorization";
const contentTypeHeader = "Content-Type";

// fetchApiServer is a wrapper around fetch that adds the necessary headers for the Crate API or the MCP API server.
export const fetchApiServer = async (
  path: string,
  config: ApiConfig,
  jq?: string,
  httpMethod: string = "GET",
  body?: BodyInit,
): Promise<Response> => {

  // The default headers used for the fetch request.
  // The Authorization header is required for both the Crate API and the MCP API and the correct token is passed in the config object that is consumed outside this function from the context that has handled the OIDC flow to get a token.
  const headers: { [key: string]: string } = {};
  if (httpMethod !== "PATCH") {
    headers[contentTypeHeader] = "application/json";
  } else {
    headers[contentTypeHeader] = "application/merge-patch+json";
  }
  headers[authHeader] = config.crateAuthorization;

  // Set the jq header to do a jq transformation on the proxy server.
  if (jq) headers[jqHeader] = jq;

  // If the config object has a mcpConfig, it is assumed that the request is for the MCP API server and the necessary headers are set for the backend to get the OIDC kubeconfig without exposing it to the frontend, 
  // otherwise, the useCrateClusterHeader is set to true to indicate that the request is for the Crate
  if (config.mcpConfig !== undefined) {
    headers[projectNameHeader] = config.mcpConfig.projectName;
    headers[workspaceNameHeader] = config.mcpConfig.workspaceName;
    headers[mcpNameHeader] = config.mcpConfig.controlPlaneName;
    headers[contextHeader] = config.mcpConfig.contextName;
    headers[mcpAuthHeader] = config.mcpConfig.mcpAuthorization;
  } else {
    headers[useCrateClusterHeader] = "true";
  }

  const res = await fetch(`${config.apiProxyUrl}${path}`, {
    headers,
    method: httpMethod,
    body,
  });

  if (!res.ok) {
    const error = new APIError('An error occurred while fetching the data.', res.status)
    error.info = await res.json()
    throw error
  }

  return res;
};

export const fetchApiServerJson = async <T>(
  path: string,
  config: ApiConfig,
  jq?: string,
  httpMethod: string = "GET",
  body?: BodyInit,
): Promise<T> => {
  const res = await fetchApiServer(path, config, jq, httpMethod, body);

  return await res.json();
};

// request is of [path, config, jq]
export const fetchApiServerJsonMultiple = (
  requests: [string | null, ApiConfig, string | undefined][],
) => {
  return Promise.all(
    requests
      .filter((r) => r[0] !== null)
      .map(([path, config, jq]) =>
        // @ts-expect-error path is not null
        fetchApiServer(path, config, jq).then((res) => res.json()),
      ),
  );
};

