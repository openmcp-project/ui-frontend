import { Landscape, defaultBranding } from '../context/FrontendConfigContext.tsx';

export const isInTestingMode: boolean = !!window.Cypress;
const documentationBaseUrl = 'http://localhost:3000';
const githubBaseUrl = 'https://github.com/example/repo';

export const mockedFrontendConfig = {
  landscape: Landscape.Local,
  documentationBaseUrl: documentationBaseUrl,
  githubBaseUrl: githubBaseUrl,
  feedbackUrl: null,
  branding: defaultBranding,
  featureToggles: {
    markMcpV1asDeprecated: false,
    enableMcpV2: false,
    enableHeadlamp: false,
    showLandscaperCard: false,
  },
};
