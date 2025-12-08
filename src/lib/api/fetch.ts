import { APIError } from './error';
import * as Sentry from '@sentry/react';
import { ApiConfig } from './types/apiConfig';
import { AUTH_FLOW_SESSION_KEY } from '../../common/auth/AuthCallbackHandler.tsx';
import { getRedirectSuffix } from '../../common/auth/getRedirectSuffix.ts';

const useCrateClusterHeader = 'X-use-crate';
const projectNameHeader = 'X-project';
const workspaceNameHeader = 'X-workspace';
const mcpNameHeader = 'X-mcp';
const jqHeader = 'X-jq';
const contentTypeHeader = 'Content-Type';

/**
 * Attempts to parse the response body as JSON. If parsing fails, returns the raw text.
 *
 * @param {Response} res - The fetch Response object.
 * @returns {Promise<unknown>} The parsed JSON object or the raw text if parsing fails.
 */
export const parseJsonOrText = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * Wrapper around fetch that adds the necessary headers for the Crate API or the MCP API server.
 * Handles authentication, content type, and custom headers for backend routing.
 * Redirects to login if the response is unauthorized (401).
 *
 * @param {string} path - The API endpoint path (appended to `/api/onboarding`).
 * @param {ApiConfig} config - The API configuration, including authentication and MCP/Crate context.
 * @param {string} [jq] - Optional jq transformation string for the proxy server.
 * @param {string} [httpMethod='GET'] - The HTTP method to use (GET, POST, PATCH, etc.).
 * @param {BodyInit} [body] - The request body, if applicable.
 * @returns {Promise<Response>} The fetch Response object.
 * @throws {APIError} Throws an APIError if the response is not ok.
 */
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
  // otherwise, the useCrateClusterHeader is set to true to indicate that the request is for the Crate.
  if (config.mcpConfig !== undefined) {
    headers[projectNameHeader] = config.mcpConfig.projectName;
    headers[workspaceNameHeader] = config.mcpConfig.workspaceName;
    headers[mcpNameHeader] = config.mcpConfig.controlPlaneName;
  } else {
    headers[useCrateClusterHeader] = 'true';
  }

  let res: Response;
  try {
    res = await fetch(`/api/onboarding${path}`, {
      headers,
      method: httpMethod,
      body,
    });
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        method: httpMethod,
        path: `/api/onboarding${path}`,
      },
    });
    throw error;
  }

  if (!res.ok) {
    if (res.status === 401) {
      // Unauthorized (token expired), redirect to the login page.
      sessionStorage.setItem(AUTH_FLOW_SESSION_KEY, 'onboarding');
      window.location.replace(`/api/auth/onboarding/login?redirectTo=${encodeURIComponent(getRedirectSuffix())}`);
    }
    const error = new APIError('An error occurred while fetching the data.', res.status);
    error.info = await parseJsonOrText(res);

    Sentry.captureException(error, {
      extra: {
        method: httpMethod,
        path: `/api/onboarding${path}`,
        status: res.status,
        responseBody: error.info,
      },
    });

    throw error;
  }

  return res;
};

/**
 * Calls fetchApiServer and parses the response as JSON.
 *
 * @template T
 * @param {string} path - The API endpoint path (appended to `/api/onboarding`).
 * @param {ApiConfig} config - The API configuration, including authentication and MCP/Crate context.
 * @param {string} [jq] - Optional jq transformation string for the proxy server.
 * @param {string} [httpMethod='GET'] - The HTTP method to use (GET, POST, PATCH, etc.).
 * @param {BodyInit} [body] - The request body, if applicable.
 * @returns {Promise<T>} The parsed JSON response.
 * @throws {APIError} Throws an APIError if the response is not ok.
 */
export const fetchApiServerJson = async <T>(
  path: string,
  config: ApiConfig,
  jq?: string,
  httpMethod: string = 'GET',
  body?: BodyInit,
): Promise<T> => {
  const res = await fetchApiServer(path, config, jq, httpMethod, body);

  return await res.json();
};
