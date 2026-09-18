type McpConfig = {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
  isV2?: boolean;
  idp?: string;
};

//syntax basically combines all the atrributes from the types into one
export type ApiConfig = {
  mcpConfig: McpConfig | undefined;
};

export const generateCrateAPIConfig = (): ApiConfig => {
  return {
    mcpConfig: undefined,
  };
};
