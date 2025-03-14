type Auth = {
  crateAuthorization: string;
};

type ProxyConfig = {
  apiProxyUrl: string;
};

type McpConfig = {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
  contextName: string;
  mcpAuthorization: string;
};

//syntax basically combines all the atrributes from the types into one
export type ApiConfig = ProxyConfig &
  Auth & {
    mcpConfig: McpConfig | undefined;
  };

export const generateCrateAPIConfig = (
  apiProxyUrl: string,
  token: string,
): ApiConfig => {
  return {
    crateAuthorization: token,
    apiProxyUrl: apiProxyUrl,
    mcpConfig: undefined,
  };
};
